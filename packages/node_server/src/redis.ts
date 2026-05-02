import Redis from "ioredis";
import { config } from "./config";

export const redis = new Redis(
  config.redis_url,
  {
    maxRetriesPerRequest: null,
  },
);

redis.on("connect", () => console.log("[Redis] connected"));
redis.on("ready", () => console.log("[Redis] ready"));
redis.on("error", (err) => console.error("[Redis error]", err));
