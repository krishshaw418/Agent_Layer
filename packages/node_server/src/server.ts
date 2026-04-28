import express from "express";
import { authenticateReq } from "./auth";
import newJobRoute from "./routes";

export async function createServer() {
    const app = express();
    app.use(express.json());

    // Register routes
    app.use('/api', authenticateReq, newJobRoute);

    return app;
}