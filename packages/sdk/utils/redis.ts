import { createClient } from "redis";

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: "rediss://default:gQAAAAAAAbGzAAIgcDFiMDU4NTMyOGJmN2Y0OWEzYmEyMDU4YzUwNjUwMTEzNw@touching-lamprey-111027.upstash.io:6379"
    });

    redisClient.on("error", console.error);
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}