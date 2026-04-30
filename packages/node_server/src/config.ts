import { defaultConfigSchema, manualConfigSchema } from "./schema";
import defaultConfig from "../default.config.json";
import manualConfig from  "../manual.config.json";

const parsedDefault = defaultConfigSchema.parse(defaultConfig);
const parsedManual = manualConfigSchema.parse(manualConfig);

export const config = {

    // Default configs
    port: parsedDefault.PORT,
    contract_add: parsedDefault.CONTRACT_ADDRESS,
    new_jobs_channel: parsedDefault.NEW_JOBS_CHANNEL,
    job_assign_channel: parsedDefault.JOB_ASSIGN_CHANNEL,
    ollama_host: parsedDefault.OLLAMA_HOST,
    ollama_port: parsedDefault.OLLAMA_PORT,

    // Manual configs
    redis_host: parsedManual.IO_REDIS_HOST,
    redis_port: parsedManual.IO_REDIS_PORT,
    redis_username: parsedManual.IO_REDIS_USERNAME,
    redis_password: parsedManual.IO_REDIS_PASSWORD,
    rpc_url: parsedManual.BASE_RPC_URL,
    priv_key: parsedManual.PRIVATE_KEY,
    public_key: parsedManual.PUBLIC_ADDRESS,
    node_url: parsedManual.NODE_QUERY_URL,
    node_api_key: parsedManual.NODE_API_KEY,
    model: parsedManual.MODEL
}
