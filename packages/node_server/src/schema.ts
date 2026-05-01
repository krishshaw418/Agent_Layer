import z from "zod";

export const manualConfigSchema = z.object({
    IO_REDIS_USERNAME: z.string(),
    IO_REDIS_HOST: z.string(),
    IO_REDIS_PORT: z.coerce.number(),
    IO_REDIS_PASSWORD: z.string(),
    NODE_QUERY_URL: z.string(),
    NODE_API_KEY: z.string(),
    BASE_RPC_URL: z.string(),
    PRIVATE_KEY: z.string(),
    PUBLIC_ADDRESS: z.string(),
    MODEL: z.string()
});

export const defaultConfigSchema = z.object({
    PORT: z.coerce.number().default(3000),
    CONTRACT_ADDRESS: z.string(),
    NEW_JOBS_CHANNEL: z.string(),
    JOB_ASSIGN_CHANNEL: z.string(),
    OLLAMA_HOST: z.ipv4(),
    OLLAMA_PORT: z.coerce.number()
})

export const jobIdSchema = z.object({
    job_id: z.string(),
});

export const jobAssignSchema = z.object({
    job_id: z.string(),
    node_id: z.hex()
})