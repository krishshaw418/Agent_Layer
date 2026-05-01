import { Worker } from "bullmq";
import { preflightCommand, buildPromptFromJob } from "node";
import type { Job, Bid } from "node";
import { submitBid, submitResult } from "./utils";
import axios from "axios";
import { config } from "./config";
import { redis } from "./redis";

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

    // Directly fetch response from ollama running locally
    const ollamaResponse = await axios.post(`${config.ollama_host}/api/generate`,
      {
        model:  config.model,
        prompt,
        stream: false,
        options: {
          num_predict: job.constraints?.max_token ?? 2048,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = ollamaResponse.data;
    if (!result) {
      throw new Error(`Ollama generation failed: ${ollamaResponse.status}`);
    }

    // Submit Result
    await submitResult(result);

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