import { config } from "./config";
import { jobAssignSchema, msgSchema } from "./schema";
import { newJobsQueue, assignedJobsQueue } from "./queue";
import { redis } from "./redis";
import WebSocket from "ws";

async function main() {
  const ws = new WebSocket(`ws://127.0.0.1:8080?type=node&nodeId=${config.public_key}`);

  ws.on('open', () => {
    console.log('Connected to the node_gateway!');
  });

  ws.on('message', async (data, _isBinary) => {

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
        const { nodeId, jobId } = msg.data;

        if (nodeId !== config.public_key) return; // Check if this node is assigned with a job

        const existing = await assignedJobsQueue.getJob(jobId);
        if (existing) return;

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

  // app.listen(config.port, () => {
  //   console.log(`Listening on port: ${config.port}`);
  // });

  // const subscriber = redis.duplicate();
  // subscriber.on("connect", () => console.log("[Redis Subscriber] connected"));
  // subscriber.on("ready", () => console.log("[Redis Subscriber] ready"));
  // subscriber.on("error", (err) =>
  //   console.error("[Redis Subscriber error]", err),
  // );

    // Subscribe to new jobs
//     await subscriber.subscribe(config.new_jobs_channel, config.job_assign_channel);

//     subscriber.on("message", async (channel, msg) => {
//         if (channel === config.new_jobs_channel) {
//         const parsed = JSON.parse(msg);
//         console.log(`Received message at ${channel}: ${JSON.stringify(parsed)}`)

//         const existing = await newJobsQueue.getJob(parsed.job_id);
//         if (existing) return;

//         await newJobsQueue.add("new_job", parsed, {
//             jobId: parsed.job_id,
//             removeOnComplete: true,
//             removeOnFail: true,
//         });
//         }

//         if (channel === config.job_assign_channel) {
//         const parsed = JSON.parse(msg);
//         console.log(`Received message at ${channel}: ${JSON.stringify(parsed)}`);

//         if (parsed.nodeId !== config.public_key) return;

//         const existing = await assignedJobsQueue.getJob(parsed.jobId);
//           console.log(existing);
//         if (existing) return;

//         await assignedJobsQueue.add("new_assigned_job", parsed.jobId, {
//             jobId: parsed.jobId,
//             removeOnComplete: true,
//             removeOnFail: true,
//         });
//         }
//     });

//     // Subscribe second channel
//     // await subscriber.subscribe(config.job_assign_channel);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
