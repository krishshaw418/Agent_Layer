import z from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    IO_REDIS_USERNAME: z.string(),
    IO_REDIS_HOST: z.url(),
    IO_REDIS_PORT: z.coerce.number(),
    IO_REDIS_PASSWORD: z.string(),
    WEBHOOK_SECRET: z.base64(),
    CHANNEL_NAME: z.string(),
    DB_URI: z.string(),
    BASE_SEPOLIA_RPC_URL: z.url(),
    CONTRACT_ADDRESS: z.string(),
    PRIVATE_KEY: z.hex(),
    PUBLIC_ADDRESS: z.hex()
});

export const jobIdSchema = z.object({
    job_id: z.string(),
});