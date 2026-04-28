import { createClient } from "redis";
import { config } from "./config";

const redisClient = createClient({
    url: `redis://${config.redis_host}:${config.redis_port}`
});

redisClient.on('error', (err) => {
    console.error("Redis connection error: ", err);
});

await redisClient.connect();

export default redisClient;