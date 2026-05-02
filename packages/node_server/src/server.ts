import express from "express";
import { redis } from "./redis";
import { config } from "./config";

export function createServer() {
  const app = express();
  app.use(express.json());

  app.post("/chat/stream", async (req, res) => {
    const job_id = req.query.job_id as string | undefined;
    const apiKey = req.query.apiKey as string | undefined;

    if (!job_id) {
      return res.status(400).json({ error: "job_id required" });
    }

    if (!apiKey) {
      return res.status(400).json({ error: "apiKey required" });
    }

    if (apiKey !== config.node_api_key) {
      return res.status(401).json({ error: "Invalid apiKey" });
    }

    const sub = redis.duplicate();
    await sub.subscribe(`stream:${job_id}`);

    // headers for streaming
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Content-Type-Options", "nosniff");

    let closed = false;

    const cleanup = async () => {
      if (closed) return;
      closed = true;

      try {
        await sub.unsubscribe(`stream:${job_id}`);
        await sub.quit();
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };

    sub.on("message", async (channel, message) => {
      console.log(`${channel}:${message}`);
      try {
        if (message === "__END__") {
          res.write(JSON.stringify({ done: true }) + "\n");
          res.end();
          await cleanup();
          return;
        }

        // Wrap chunk in structured format
        const payload = {
          choices: [
            {
              delta: {
                content: message,
              },
            },
          ],
        };

        res.write(JSON.stringify(payload) + "\n");

      } catch (err) {
        console.error("Stream error:", err);
        res.end();
        await cleanup();
      }
    });

    req.on("close", async () => {
      await cleanup();
    });

    req.on("error", async () => {
      await cleanup();
    });
  });

  return app;
}