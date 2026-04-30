import { Client } from "@upstash/qstash";
import dotenv from "dotenv";
dotenv.config();

// export const qstashClient = new Client({
//   token: process.env.QSTASH_TOKEN!,
// });

export const qstashClient = new Client();