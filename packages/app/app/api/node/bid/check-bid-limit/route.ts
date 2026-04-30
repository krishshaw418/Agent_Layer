import { NextResponse } from "next/server";
import db from '@/lib/db';
import { finalizeOnMaxBid } from "@/utils/keeperHub";
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

        // Bid limit check trigger logic
        const { jobId } = await request.json();
        
        if (!jobId) {
            return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
        }

        const job = await db.job.findUnique({
            where: { id: jobId },
            select: { id: true }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Trigger the KeeperHub workflow to check for max bid finalization
        const success = await finalizeOnMaxBid(jobId);

        if (!success) {
            return NextResponse.json({ error: "Failed to trigger bid limit check" }, { status: 500 });
        }

        return NextResponse.json({ message: "Bid limit check triggered successfully" });
    } catch (error) {
        console.error("Error triggering bid limit check:", error);
        return NextResponse.json({ error: "Failed to check bid limit" }, { status: 500 });
    }
}
