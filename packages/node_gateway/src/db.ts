import { MongoClient } from "mongodb";
import { config } from "./config";

const client = new MongoClient(config.mongodb_uri);

await client.connect();

const db = client.db("agentlayer");
export const APIKey = db.collection("APIKey");