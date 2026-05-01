import { Worker } from "bullmq";
import { preflightCommand, buildPromptFromJob } from "node";
import type { Job, Bid } from "node";
import { submitBid } from "./utils";
import axios from "axios";
import { config } from "./config";
import { redis } from "./redis";
import express from "express";
import type { Request, Response, Express } from "express";

// Helper function to create an Express server instance
function createServer(): Express {
  const app = express();
  return app;
}

const bid_worker = new Worker('new_jobs_queue', async (msg) => {

  const { job_id } = msg.data; // msg.data = { job_id: string }

  try {
    const response = await axios.post<Job>(`${config.node_url}/api/node/job/get-job-details`,
      {
        "jobId": job_id
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.node_api_key}`
        },
      });

    const job = response.data;

    if (!job) {
      throw new Error("Job not found!");
    }

    // Deadline check — discard silently if expired
    const expiresAt = job.created_at * 1000 + (job.constraints?.deadline ?? 0);
    if (Date.now() >= expiresAt) {
      console.log(`[worker]: ${msg.id} expired — discarding`);
      return;
    };

    // Run preflight — pass Job object directly, no file needed
    const bid: Bid | null = await preflightCommand(
      config.model, // Model to be read from node.config.json
      job,
      { estimateOnly: true, skipAccuracy: false, yes: false }
    );

    if (!bid) {
      console.log(`[worker]: ${msg.id} — no bid generated (capability mismatch or deadline)`);
      return;
    };

    // Submit Bid
    await submitBid(bid);
  } catch (error) {
    console.error(error);
    throw error;
  }
}, {
  connection: redis.duplicate(),
  concurrency: 1
});

bid_worker.on('error', (err) => {
  console.error('[bid-worker-error]: ', err);
});

const generate_worker = new Worker('assigned_jobs_queue', async (msg) => {

  const job_id = msg.data;
  
  try {
    
    const response = await axios.post<Job>(`${config.node_url}/api/node/job/get-job-details`,
      {
        "jobId": job_id
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.node_api_key}`
        }
      });

    const job = response.data;

    if (!job) {
      throw new Error("Job not found!");
    }

    // Build prompt using the prompt builder
    const prompt = buildPromptFromJob(job.task);

    // Create a server
    const app = createServer();

    app.post('/api/node-response', async (req: Request, res: Response) => {

      // Set streaming headers
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Content-Type-Options', 'nosniff');

      try {
        // Directly fetch response from ollama running locally
        const ollamaResponse = await axios({
          method: 'POST',
          url: `${config.ollama_host}/api/generate`,
          data: {
            model: config.model,
            prompt,
            stream: true,
            options: {
              num_predict: job.constraints?.max_token ?? 2048,
            }
          },
          responseType: 'stream',
          timeout: 120000
        });

        let fullResponse = '';

        ollamaResponse.data.on('data', (chunk: Buffer | string) => {
          const chunkStr = chunk.toString();

          const lines = chunkStr.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);

              if (parsed.response) {
                fullResponse += parsed.response;
                res.write(parsed.response);
              }

              if (parsed.done) {
                res.end();
              }

            } catch (error) {
              console.error('Parse error:', error);
            }
          }
        });

        ollamaResponse.data.on('error', (err: any) => {
          console.error('Ollama stream error:', err);
          res.end();
        });

        req.on('close', () => {
          // Cleanup
          ollamaResponse.data.destroy();
        });
      } catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ error: 'Failed to communicate with Ollama' });
      }
    });

    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });

  } catch (error) {
    console.error(error);
    throw error;
  }
  
}, {
  connection: redis.duplicate(),
  concurrency: 1
});

generate_worker.on('error', (err) => {
  console.error("[generate-worker-error]: ", err);
})