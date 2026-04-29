import { createClient } from "redis";
import { config } from "./config";

const pubClient = createClient({
    url: `redis://${config.redis_host}:${config.redis_port}`
});

pubClient.on('error', (err) => {
    console.error("Redis connection error: ", err);
});

await pubClient.connect();

export default pubClient;