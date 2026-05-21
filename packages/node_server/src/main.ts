import { config } from "./config";
import { msgSchema } from "./schema";
import { newJobsQueue, assignedJobsQueue } from "./queue";
import { redis } from "./redis";
import { ws } from "./socket";

async function main() {

  // Create a duplicate instance of redis connection
  const subscriber = redis.duplicate();

  subscriber.on('message', async (channel, chunk) => {
    if (chunk === "__END__") {
      ws.send(JSON.stringify({ event: "response-stream-end", data: { jobId: channel.split(':')[1] } }), (err) => {
        if(err) console.error("Error: ", err);
      });
      return;
    }
    ws.send(JSON.stringify({ event: "response-stream", data: { jobId: channel.split(':')[1], chunk: chunk } }), (err) => {
      if(err) console.error("Error: ", err);
    });
  });
    
  subscriber.on("connect", () => console.log("[Redis Subscriber] connected"));
  subscriber.on("error", (err) =>
    console.error("[Redis Subscriber error]", err),
  );

  ws.on('open', () => {
    console.log('Connected to the node_gateway!');
  });

  ws.on('message', async (data, _isBinary) => {
    console.log("RAW MESSAGE: ", data.toString());
    const parsed = msgSchema.safeParse(JSON.parse(data.toString()));

    if (!parsed.success) {
      console.error(parsed.error);
      return;
    }

    const msg = parsed.data;

    switch (msg.event) {
      case "jobs": {
        console.log("Job received: \n", msg.data);
        const jobId = msg.data.jobId;
        const existing = await newJobsQueue.getJob(jobId);
        if (existing) return;

        await newJobsQueue.add("new_job", msg.data, {
          jobId,
          removeOnComplete: true,
          removeOnFail: true,
        });
        break;
      }
      case "assigned-job": {
        console.log("Job assigned: \n", msg.data);
        const { jobId, nodeId } = msg.data;

        if (nodeId !== config.public_key) return; // Check if this node is assigned with a job

        const existing = await assignedJobsQueue.getJob(jobId);
        if (existing) return;

        // Subscribe to the stream-channel
        await subscriber.subscribe(`stream:${jobId}`);

        await assignedJobsQueue.add("new_assigned_job", jobId, {
            jobId: jobId,
            removeOnComplete: true,
            removeOnFail: true,
        });

        break;
      }
      default: {
        console.log("No such event found!");
        break;
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    ws.terminate();
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
