import z from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number()
});

export const msgSchema = z.object({
    event: z.string(),
    data: z.object({
        jobId: z.string(),
        nodeId: z.optional(z.string()),
        chunk: z.optional(z.string())
    }).strict()
})