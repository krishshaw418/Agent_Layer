import {qstashClient} from "@/lib/qstash";
import dotenv from "dotenv";
dotenv.config();
console.log("Webhook API KEY:", process.env.KEEPERHUB_WEBHOOK_API_KEY);


export async function scheduleFinalizeJob(jobId: string, runAt: number): Promise<boolean> {
  try {
    const runAtMs = (runAt+1) * 1000;

    const delaySeconds = Math.max(
      0,
      Math.floor((runAtMs - Date.now()) / 1000)
    );

    const response = await qstashClient.publishJSON({
        url: "https://app.keeperhub.com/api/workflows/h8yt3jbfiezqn7cvegsf4/webhook",
        headers: {
            Authorization: process.env.KEEPERHUB_WEBHOOK_API_KEY!,
        },
        body: {
            jobId,
            runAt: new Date(runAtMs).toISOString(),
        },
        delay: delaySeconds,
    });

    console.log(`[${new Date().toISOString()}]`, 
      "Scheduled job:",
      jobId,
      "runAt:", new Date(runAtMs).toISOString(),
      "delaySeconds:", delaySeconds,
      "messageId:", response.messageId
    );

    return true;

  } catch (error) {
    console.error("Error scheduling job:", error);
    return false;
  }
}


export async function finalizeOnMaxBid(jobId: string): Promise<boolean> {
    const apiKey = process.env.KEEPERHUB_WEBHOOK_API_KEY!.trim();
    const response = await fetch("https://app.keeperhub.com/api/workflows/4kknw5aboz6due4ydbd1y/webhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": apiKey
        },
        body: JSON.stringify({
            jobId: jobId,
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.log("KeeperHub error:", response.status, text);
        return false;
    } else {
        console.log("Successfully checked for finalized job on KeeperHub for max bids:", jobId);
        return true;
    }
}