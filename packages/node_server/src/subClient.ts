import { createClient } from "redis";
import { config } from "./config";

const subClient = createClient({
    url: `redis://${config.redis_host}:${config.redis_port}`
});

subClient.on('error', (err) => {
    console.error("Redis connection error: ", err);
});

await subClient.connect();

export default subClient;