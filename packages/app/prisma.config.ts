import { defineConfig } from "@prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  engine: "classic",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});