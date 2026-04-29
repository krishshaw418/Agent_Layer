import subClient from "./subClient";
import { config } from "./config";
import { preflightCommand } from "node";
import type { Job, Bid } from "node";
import { submitBid }from "./utils";

await subClient.subscribe(config.channel_name, async (msg) => {
  const job: Job = JSON.parse(msg);

  // Deadline check — discard silently if expired
  const expiresAt = job.created_at * 1000 + (job.constraints?.deadline ?? 0);
  if (Date.now() >= expiresAt) {
    console.log(`[worker] ${job.job_id} expired — discarding`);
    return;
  };

  // Run preflight — pass Job object directly, no file needed
  const bid: Bid | null = await preflightCommand(
    "qwen2:0.5b",
    job,
    { estimateOnly: true, skipAccuracy: false, yes: false }
  );

  if (!bid) {
    console.log(`[worker] ${job.job_id} — no bid generated (capability mismatch or deadline)`);
    return;
  };

  await submitBid(bid);
})