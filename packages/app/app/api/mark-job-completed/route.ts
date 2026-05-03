import { NextResponse } from "next/server";
import db from '@/lib/db';
import { markJobAsCompleted } from "@/utils/keeperHub";
import { hashApiKey } from "@/utils/generateAPIKey";

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

    const userPublicKey = validKey.userPublicKey;

    const body = await request.json();

    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // find the job in the database
    const job = await db.job.findUnique({ where: { id: jobId } });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    // check if the job belongs to the user
    if (job.createdBy !== userPublicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // update the job status to completed
    await db.job.update({
      where: { id: jobId },
      data: { status: "completed" },
    });

    // trigger a keeperhub workflow to markJobAsCompleted on chain
    const success = await markJobAsCompleted(jobId);

    if (!success) {
      return NextResponse.json({ error: "Failed to mark job as completed on chain" }, { status: 500 });
    }

    return NextResponse.json({ message: "Job marked as completed" });
  } catch (error) {
    console.log("Error in mark-job-completed route:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
