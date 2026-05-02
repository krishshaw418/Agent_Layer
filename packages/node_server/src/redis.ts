import Redis from "ioredis";
import { config } from "./config";

// export const redis = new IORedis({
//   host: config.redis_host,
//   port: config.redis_port,
//   username: config.redis_username,
//   password: config.redis_password,
//   tls: {},
//   maxRetriesPerRequest: null,
// });

export const redis = new Redis(
  "rediss://default:gQAAAAAAAbGzAAIgcDFiMDU4NTMyOGJmN2Y0OWEzYmEyMDU4YzUwNjUwMTEzNw@touching-lamprey-111027.upstash.io:6379",
  {
    maxRetriesPerRequest: null,
  },
);

redis.on("connect", () => console.log("[Redis] connected"));
redis.on("ready", () => console.log("[Redis] ready"));
redis.on("error", (err) => console.error("[Redis error]", err));
