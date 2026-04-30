import { NextResponse } from "next/server";
import db from '@/lib/db';
import { getNodeReputationOnChain } from "@/utils/backendOnChainHandlers";
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


        // Get job details logic
        const { jobId } = await request.json();

        // Validate input
        if (!jobId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const job = await db.job.findUnique({
            where: { id: jobId }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, job });
    } catch (error) {
        console.error("Error fetching job details:", error);
        return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 });
    }
}
