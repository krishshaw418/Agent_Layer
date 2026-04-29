import "dotenv/config";
import { envSchema } from "./schema";

const parsedEnv = envSchema.parse(process.env);

export const config = {
    port: parsedEnv.PORT,
    redis_host: parsedEnv.REDIS_HOST,
    redis_port: parsedEnv.REDIS_PORT,
    auth_secret: parsedEnv.WEBHOOK_SECRET,
    channel_name: parsedEnv.CHANNEL_NAME,
    db_uri: parsedEnv.DB_URI
}