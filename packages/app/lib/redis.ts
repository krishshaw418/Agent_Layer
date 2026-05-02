// redisPublisher.ts
import { createClient } from "redis";

const connection = {
  host: process.env.IO_REDIS_HOST || "localhost",
  port: parseInt(process.env.IO_REDIS_PORT || "6379", 10),
};


let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: connection.host,
        port: connection.port,
      },
    });

    redisClient.on("error", console.error);
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}