import "dotenv/config";
import { envSchema } from "./schema";

const parsedEnv = envSchema.parse(process.env);

export const config = {
    port: parsedEnv.PORT,
    redis_host: parsedEnv.IO_REDIS_HOST,
    redis_port: parsedEnv.IO_REDIS_PORT,
    redis_username: parsedEnv.IO_REDIS_USERNAME,
    redis_password: parsedEnv.IO_REDIS_PASSWORD,
    auth_secret: parsedEnv.WEBHOOK_SECRET,
    channel_name: parsedEnv.CHANNEL_NAME,
    db_uri: parsedEnv.DB_URI,
    rpc_url: parsedEnv.BASE_SEPOLIA_RPC_URL,
    priv_key: parsedEnv.PRIVATE_KEY,
    contract_add: parsedEnv.CONTRACT_ADDRESS,
    node_add: parsedEnv.PUBLIC_ADDRESS
}