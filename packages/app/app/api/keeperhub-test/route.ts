async function FinalizeJob(jobId: string): Promise<boolean> {
    try {
        const response = await fetch("https://app.keeperhub.com/api/workflows/h8yt3jbfiezqn7cvegsf4/webhook", {
            method: "POST",
            headers: {
                "Authorization": process.env.KEEPERHUB_WEBHOOK_API_KEY!,
            },
            body: JSON.stringify({
                jobId
            }),
        })

        if (!response.ok) {
            const text = await response.text();
            console.log("KeeperHub error:", response.status, text);
            return false;
        }

        console.log("Response", response)

        return true;

    } catch (error) {
        console.error("Error finalizing job:", error);
        return false;
    }
}

export async function GET() {
    try {
        const finalizeRes = await FinalizeJob("6a1e4cd90133bd2cbeedd7d4");
        if (finalizeRes) {
            return Response.json({ success: true, message: "Job finalized successfully" });
        } else {
            return Response.json({ success: false, message: "Failed to finalize job" });
        }
    } catch (error) {
        console.error("Error finalizing job:", error);
        return Response.json({ success: false, message: "Failed to finalize job" });
    }
}