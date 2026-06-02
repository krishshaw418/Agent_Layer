import { NextResponse } from "next/server";
import db from '@/lib/db';
import dotenv from "dotenv";
import { getRedisClient } from "@/lib/redis";
import { sendMessageToGateway } from "@/utils/ws";
import { checkJobFailed } from "@/utils/githubActionTrigger";

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

        console.log(`Checking if job failed with jobId: ${jobId}`);

        const checkJobFailedTriggerResponse = await checkJobFailed(jobId)

        if (!checkJobFailedTriggerResponse) {
            return NextResponse.json({ error: "Failed to trigger job failure" }, { status: 500 });
        }

        return NextResponse.json({ message: "Job failure notified successfully" });
    } catch (error) {
        console.log("Error in notify-job-failure:", error);
        return NextResponse.json({ error: "An error occurred" }, { status: 500 });
    }
}
