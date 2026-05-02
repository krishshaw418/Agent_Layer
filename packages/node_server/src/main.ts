import { config } from "./config";
import { jobAssignSchema, jobIdSchema } from "./schema";
import { newJobsQueue, assignedJobsQueue } from "./queue";
import { redis } from "./redis";
import { createServer } from "./server";

async function main() {

    const app = createServer();

    app.listen(config.port, () => {
        console.log(`Listening on port: ${config.port}`);
    });

    const subscriber = redis.duplicate();

    // Subscribe to new jobs
    await subscriber.subscribe(config.new_jobs_channel, config.job_assign_channel);

    subscriber.on("message", async (channel, msg) => {
        if (channel === config.new_jobs_channel) {
        const parsed = JSON.parse(msg);
        console.log(`Received message at ${channel}: ${JSON.stringify(parsed)}`)

        const existing = await newJobsQueue.getJob(parsed.job_id);
        if (existing) return;

        await newJobsQueue.add("new_job", parsed, {
            jobId: parsed.job_id,
            removeOnComplete: true,
            removeOnFail: true,
        });
        }

        if (channel === config.job_assign_channel) {
        const parsed = JSON.parse(msg);
        console.log(`Received message at ${channel}: ${JSON.stringify(parsed)}`);

        if (parsed.nodeId !== config.public_key) return;

        const existing = await assignedJobsQueue.getJob(parsed.jobId);
          console.log(existing);
        if (existing) return;

        await assignedJobsQueue.add("new_assigned_job", parsed.jobId, {
            jobId: parsed.jobId,
            removeOnComplete: true,
            removeOnFail: true,
        });
        }
    });

    // Subscribe second channel
    // await subscriber.subscribe(config.job_assign_channel);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});