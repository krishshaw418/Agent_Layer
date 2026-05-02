// redisPublisher.ts
import { createClient } from "redis";

const connection = {
  host: process.env.IO_REDIS_HOST || "redis-11311.c292.ap-southeast-1-1.ec2.cloud.redislabs.com",
  port: parseInt(process.env.IO_REDIS_PORT || "11311", 10),
  username: process.env.IO_REDIS_USERNAME || "default",
  password: process.env.IO_REDIS_PASSWORD || "GwR09NEiLrXvC4Z4a78ri2pEgSYk6Pfp",
};


let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      socket: {
        host: connection.host,
        port: connection.port,
      },
      username: connection.username,
      password: connection.password,
    });

    redisClient.on("error", console.error);
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}


// "IO_REDIS_USERNAME": "default",
// "IO_REDIS_HOST": "redis-11311.c292.ap-southeast-1-1.ec2.cloud.redislabs.com",
// "IO_REDIS_PORT": 11311,
// "IO_REDIS_PASSWORD": "GwR09NEiLrXvC4Z4a78ri2pEgSYk6Pfp",