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


        // Get bids details logic
        const { bidId } = await request.json();

        // Validate input
        if (!bidId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const bid = await db.bid.findFirst({
            where: { id: bidId }
        });

        return NextResponse.json({ success: true, bid });
    } catch (error) {
        console.error("Error fetching bids:", error);
        return NextResponse.json({ error: "Failed to fetch bids" }, { status: 500 });
    }
}
