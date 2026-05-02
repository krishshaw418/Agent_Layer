import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: "rediss://default:gQAAAAAAAbGzAAIgcDEyYTE2NzNkYTY1Yjc0NTEyOTg3NDM1YmNjZjZiOTY0MA@touching-lamprey-111027.upstash.io:6379"
    });

    redisClient.on("error", console.error);
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}