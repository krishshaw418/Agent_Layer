import z from "zod";

export const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    REDIS_HOST: z.ipv4().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().default(6379),
    WEBHOOK_SECRET: z.base64(),
    CHANNEL_NAME: z.string()
});

export const jobSchema = z.object({
    job_id: z.string(),
    created_at: z.coerce.number(),
    task: z.object({
        type: z.enum([
            "code_generation",
            "summarization",
            "translation",
            "question_answer",
            "creative_writing",
            "analysis",
            "extraction"
        ]),
        input: z.object({
            type: z.enum(["file_url", "text", "image_url"]),
            url: z.optional(z.url()),
            text: z.optional(z.string()),
            mime: z.optional(z.file().mime(
                ["application/pdf",
                "application/json",
                "text/plain",
                "image/png",
                "image/jpeg",
                "image/webp",
                "image/gif"]
            )),
            size_byte: z.optional(z.number()),
        }),
        expected_output: z.enum(["text", "json", "image"])
    }),
    constraints: z.optional(z.object({
        max_token: z.optional(z.number()),
        deadline: z.optional(z.number()),
        priority: z.optional(z.enum(["fast", "balanced", "quality"])),
        quality: z.optional(z.enum(["low", "medium", "high"]))
    }))
});