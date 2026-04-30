import { NextResponse } from "next/server";
import { redisClient } from "@/lib/redis";
import dotenv from "dotenv";
dotenv.config();

const WEBHOOK_SECRET = process.env.APP_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  try {
    // get webhook secret from headers
    const webhookSecret = request.headers.get("X-Webhook-Secret")?.trim();

    if (!webhookSecret || webhookSecret !== WEBHOOK_SECRET) {
      console.log("Invalid webhook secret:", webhookSecret);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { jobId, nodeId } = body;

    if (!jobId || !nodeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`Received job failure notification for jobId: ${jobId}, nodeId: ${nodeId}`);

    // publish the jobId and nodeId to Redis channel
    const channel = "job-assignment-channel";

    await redisClient.publish(channel, JSON.stringify({ jobId, nodeId }));

    console.log(`Published job assignment to Redis channel: ${channel}`);

    return NextResponse.json({ message: "Job assignment published successfully" }, { status: 200 });
  } catch (error) {
    console.log("Error in publishing job assignment on pubsub:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
