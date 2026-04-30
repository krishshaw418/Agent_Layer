import { config } from "./config";
import { Queue } from "bullmq";

export const connection = {
    username: 'default',
    password: config.redis_password,
    socket: {
        host: config.redis_host,
        port: config.redis_port
    }
};

const jobQueue = new Queue('job_queue', { connection });

export default jobQueue;
