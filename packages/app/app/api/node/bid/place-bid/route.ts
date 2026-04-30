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


        // Bid placing logic
        const { jobId, nodePublicKey, token, timeRequired, model } = await request.json();
        const placedAt = Math.floor(Date.now() / 1000);

        // Validate input
        if (!jobId || !nodePublicKey || !token || !timeRequired || !model) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const reputationResponse = await getNodeReputationOnChain(nodePublicKey);

        if (!reputationResponse.success) {
            return NextResponse.json({ error: "Failed to fetch node reputation" }, { status: 500 });
        }

        const reputation = reputationResponse.data;

        // Store the bid in the database
        const bid = await db.bid.create({
            data: {
                jobId,
                nodePublicKey,
                placedAt,
                token,
                timeRequired,
                model,
                reputation,
            }
        });

        return NextResponse.json({ success: true, bidId: bid.id });
    } catch (error) {
        console.error("Error placing bid:", error);
        return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
    }
}
