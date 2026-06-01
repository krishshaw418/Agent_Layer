import z from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number(),
    MONGODB_URI: z.string()
});

export const msgSchema = z.object({
    event: z.string(),
    data: z.object({
        jobId: z.string(),
        nodeId: z.optional(z.string()),
        chunk: z.optional(z.string())
    }).strict()
})

export const typeSchema = z.enum(["user", "node", "server"]);

export const apiKeySchema = z.string();