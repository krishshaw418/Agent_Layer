import { NextResponse } from "next/server";
import db from '@/lib/db';
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

    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    console.log(`Received job failure notification for jobId: ${jobId}`);

    // Update job status to failed in database
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "failed",
      },
    });

    console.log(`Job with ID ${jobId} marked as failed in database.`);

    // TODO: Send the job failure notification to the user via pubsub

    return NextResponse.json({ message: "Job failure notified successfully" });
  } catch (error) {
    console.log("Error in notify-job-failure:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
