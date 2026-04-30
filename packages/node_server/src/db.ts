import { MongoClient, type Db } from "mongodb";
import { config } from "./config";

class DB {
    private static client = new MongoClient(config.db_uri);
    private static instance: Db;

    public static async getInstance() {
        if (!this.instance) {
            await this.client.connect();
            this.instance = this.client.db();
        }

        return this.instance;
    }
}

export const db = await DB.getInstance();