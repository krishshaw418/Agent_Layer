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
    await subscriber.subscribe(config.new_jobs_channel);

    subscriber.on("message", async (channel, msg) => {
        if (channel === config.new_jobs_channel) {
        const parsed = jobIdSchema.safeParse(JSON.parse(msg));

        if (!parsed.success) return;

        const existing = await newJobsQueue.getJob(parsed.data.job_id);
        if (existing) return;

        await newJobsQueue.add("new_job", parsed.data, {
            jobId: parsed.data.job_id,
            removeOnComplete: true,
            removeOnFail: true,
        });
        }

        if (channel === config.job_assign_channel) {
        const parsed = jobAssignSchema.safeParse(JSON.parse(msg));

        if (!parsed.success) return;
        if (parsed.data.node_id !== config.public_key) return;

        const existing = await assignedJobsQueue.getJob(parsed.data.job_id);
        if (existing) return;

        await assignedJobsQueue.add("new_assigned_job", parsed.data.job_id, {
            jobId: parsed.data.job_id,
            removeOnComplete: true,
            removeOnFail: true,
        });
        }
    });

    // Subscribe second channel
    await subscriber.subscribe(config.job_assign_channel);
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});