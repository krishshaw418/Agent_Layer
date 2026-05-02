import { NextResponse } from "next/server";
import db from '@/lib/db';
import { createJobFromRequest } from '@/utils/jobBuilder';
import { createJobOnChain } from "@/utils/backendOnChainHandlers";
import { scheduleFinalizeJob } from "@/utils/keeperHub";
import { hashApiKey } from "@/utils/generateAPIKey";
import { getRedisClient } from "@/lib/redis";

const redisClient = await getRedisClient();

export async function POST(request: Request) {
  try {
    // extract api key from headers
    const apiKey = request.headers.get("Authorization")?.replace("Bearer ", "").trim();
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    // generate hash of api key
    const apiKeyHash = hashApiKey(apiKey);

    // validate api key
    const validKey = await db.aPIKey.findUnique({ where: { keyHash: apiKeyHash } });
    if (!validKey) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // check if api key is revoked
    if (validKey.revoked) {
      return NextResponse.json({ error: "API key revoked" }, { status: 401 });
    }

    const body = await request.json();

    // Create job from request using the jobBuilder
    const job = await createJobFromRequest(body);

    // job deadline is current time + 60sec from request -> number
    const jobDeadline = Math.floor(Date.now() / 1000) + 60;

    // Insert job into database
    const savedJob = await db.job.create({
      data: {
        status: job.status,
        plan: job.plan,
        maxTokenAmount: job.max_token_amount,
        deadline: jobDeadline,
        priority: job.priority,
        quality: job.quality,
        minReputation: job.minReputation,
        createdBy: job.createdBy,
      },
    });

    const jobId = savedJob.id.toString().trim();

    console.log("Job saved to database with ID:", jobId);

    // Call createJob on smart contract
    const createJobResponse = await createJobOnChain(
      jobId,
      job.createdBy,
      job.max_token_amount.toString(),
      jobDeadline,
      job.priority,
      job.quality,
      job.minReputation
    );

    if (!createJobResponse.success) {
      console.error("Failed to create job on chain:", createJobResponse.error);
      
      await db.job.update({
        where: { id: jobId },
        data: { status: "failed" },
      });

      return NextResponse.json({ error: `Failed to create job on chain: ${createJobResponse.error}` }, { status: 500 });
    }

    // Schedule finalize job on keeperhub
    const scheduleResponse = await scheduleFinalizeJob(jobId, jobDeadline);

    if (!scheduleResponse) {
      console.error("Failed to schedule job finalization on KeeperHub for jobId:", jobId);
      
      await db.job.update({
        where: { id: jobId },
        data: { status: "failed" },
      });

      return NextResponse.json({ error: "Failed to schedule job finalization on KeeperHub" }, { status: 500 });
    }

    // publish jobId to redis channel "new-jobs-channel"
    const channel = "new-jobs-channel";

    await redisClient.publish(channel, JSON.stringify({ job_id: jobId }));

    console.log(`Published new job to Redis channel: ${channel}`);

    return NextResponse.json(savedJob, { status: 201 });
  } catch (error) {
    console.log("Error in chat route:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
