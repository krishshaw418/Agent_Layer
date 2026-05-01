import express from "express";
import { redis } from "./redis";
import { config } from "./config";

export function createServer() {
    const app = express();
    app.use(express.json());

    app.post("/api/node-response", async (req, res) => {
    const { job_id } = req.body;

    if (!job_id) {
        return res.status(400).json({ error: "job_id required" });
    }

    const sub = redis.duplicate();
    await sub.subscribe(`stream:${job_id}`);

    // streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    sub.on("message", (channel, message) => {
        if (message === "__END__") {
        res.end();
        sub.unsubscribe(channel);
        sub.quit();
        return;
        }

        res.write(message);
    });

    req.on("close", () => {
        sub.unsubscribe(`stream:${job_id}`);
        sub.quit();
    });
    });

    return app;
}
