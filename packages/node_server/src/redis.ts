import Redis from "ioredis";

export const redis = new Redis(
  "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null,
  },
);

redis.on("connect", () => console.log("[Redis] connected"));
redis.on("ready", () => console.log("[Redis] ready"));
redis.on("error", (err) => console.error("[Redis error]", err));
