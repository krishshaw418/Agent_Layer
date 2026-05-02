import { Worker } from "bullmq";
import { preflightCommand, buildPromptFromJob } from "node";
import type { Job, Bid } from "node";
import { submitBid } from "./utils";
import axios from "axios";
import { config } from "./config";
import { redis } from "./redis";


const bid_worker = new Worker('new_jobs_queue', async (msg) => {

  const { job_id } = msg.data; // msg.data = { job_id: string }
  console.log(`[worker]: Processing job ${job_id}`);
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
    const expiresAt = job.created_at * 1000;
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
  const pub = redis.duplicate();

  try { 
    // Fetch job details
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
    const prompt = buildPromptFromJob(job.plan.task, job.plan);
    
    // Directly fetch response from ollama running locally
    const ollamaResponse = await axios({
      method: 'POST',
      url: `${config.ollama_host}/api/generate`,
      data: {
        model: config.model,
        prompt,
        stream: true,
        options: {
          num_predict: job.max_token_amount
        }
      },
      responseType: 'stream',
      timeout: 120000
    });
    
    // Stream chunks → Redis
    ollamaResponse.data.on("data", async (chunk: Buffer | string) => {
    const lines = chunk.toString().split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);

        if (parsed.response) {
          await pub.publish(`stream:${job_id}`, parsed.response);
        }

        if (parsed.done) {
          await pub.publish(`stream:${job_id}`, "__END__");
        }
      } catch (err) {
        console.error("Parse error:", err);
      }
    }
    });
    
    ollamaResponse.data.on("end", async () => {
      await pub.publish(`stream:${job_id}`, "__END__");
    });
    
    ollamaResponse.data.on("error", async (err: any) => {
      console.error("Ollama error:", err);
      await pub.publish(`stream:${job_id}`, "__END__");
    });
  
      
  } catch (error) {
    console.error("[generate-worker-error]:", error);
    await pub.publish(`stream:${job_id}`, "__END__");
    throw error;
  }
}, {
  connection: redis.duplicate(),
  concurrency: 1
});

generate_worker.on('error', (err) => {
  console.error("[generate-worker-error]: ", err);
})