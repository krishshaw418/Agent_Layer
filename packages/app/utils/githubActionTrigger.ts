import { qstashClient } from "@/lib/qstash";
import dotenv from "dotenv";
dotenv.config();
console.log("Webhook API KEY:", process.env.KEEPERHUB_WEBHOOK_API_KEY);


export async function finalizeOnMaxBid(jobId: string): Promise<boolean> {
    const response = await fetch("https://api.github.com/repos/krishshaw418/Agent_Layer/dispatches", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
            Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
            event_type: "finalize-job-on-max-bid",
            client_payload: {
                jobId: jobId,
            },
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.log("KeeperHub error:", response.status, text);
        return false;
    } else {
        console.log("Successfully triggered for finalizing job on max bids:", jobId);
        return true;
    }
}

export async function markJobAsCompleted(jobId: string): Promise<boolean> {
    const response = await fetch("https://api.github.com/repos/krishshaw418/Agent_Layer/dispatches", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
            Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
            event_type: "mark-job-as-completed",
            client_payload: {
                jobId: jobId,
            },
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.log("Mark as completed error:", response.status, text);
        return false;
    } else {
        console.log("Successfully triggered for marking job as completed:", jobId);
        return true;
    }
}

export async function scheduleFinalizeJob(jobId: string, runAt: number): Promise<boolean> {
    try {
        const runAtMs = (runAt + 1) * 1000;

        const delaySeconds = Math.max(
            0,
            Math.floor((runAtMs - Date.now()) / 1000)
        );

        const response = await qstashClient.publishJSON({
            url: "https://api.github.com/repos/krishshaw418/Agent_Layer/dispatches",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
                Accept: "application/vnd.github+json",
            },
            body: {
                event_type: "finalize-job",
                client_payload: {
                    jobId
                },
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

export async function checkJobFailed(jobId: string): Promise<boolean> {
    const response = await fetch("https://api.github.com/repos/krishshaw418/Agent_Layer/dispatches", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
            Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
            event_type: "check-job-failed",
            client_payload: {
                jobId: jobId,
            },
        })
    });

    if (!response.ok) {
        const text = await response.text();
        console.log("Check job failed error:", response.status, text);
        return false;
    } else {
        console.log("Successfully triggered for checking job failed:", jobId);
        return true;
    }
}