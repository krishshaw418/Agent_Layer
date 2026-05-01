import IORedis from "ioredis";
import { config } from "./config";

export const redis = new IORedis({
  host: config.redis_host,
  port: config.redis_port,
  username: config.redis_username,
  password: config.redis_password,
  tls: {},
  maxRetriesPerRequest: null,
});

redis.on("connect", () => console.log("[Redis] connected"));
redis.on("ready", () => console.log("[Redis] ready"));
redis.on("error", (err) => console.error("[Redis error]", err));