import z from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    REDIS_HOST: z.ipv4().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().default(6379),
    WEBHOOK_SECRET: z.base64(),
    CHANNEL_NAME: z.string(),
    DB_URI: z.string()
});

export const jobIdSchema = z.object({
    job_id: z.string(),
});