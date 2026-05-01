import { config } from "./config";
import { Queue } from "bullmq";
import { redis } from "./redis";

const newJobsQueue = new Queue('new_jobs_queue', { connection: redis });
const assignedJobsQueue = new Queue('assigned_jobs_queue', { connection: redis});

export { newJobsQueue, assignedJobsQueue };
