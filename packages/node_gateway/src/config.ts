import "dotenv/config";
import { envSchema } from "./schema";

const parsed = envSchema.parse(process.env);

export const config = {
    port: parsed.PORT,
    mongodb_uri: parsed.MONGODB_URI
}