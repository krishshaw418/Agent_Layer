import { Worker } from "bullmq";
import { preflightCommand } from "node";
import type { Job, Bid } from "node";
import { submitBid } from "./utils";
import { connection } from "./queue";
import { db } from "./db";
import { ObjectId } from "mongodb";

const worker = new Worker('job_queue', async (msg) => {

  const { job_id } = msg.data;

  try {
    const job = await db.collection<Job>('job').findOne({ _id: new ObjectId(job_id) });

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
      "qwen2:0.5b",
      job,
      { estimateOnly: true, skipAccuracy: false, yes: false }
    );

    if (!bid) {
      console.log(`[worker]: ${msg.id} — no bid generated (capability mismatch or deadline)`);
      return;
    };

    await submitBid(bid);
  } catch (error) {
    console.error(error);
    throw error;
  }
}, {
  connection
});

worker.on('error', (err) => {
  console.error('[worker-error]: ', err);
})