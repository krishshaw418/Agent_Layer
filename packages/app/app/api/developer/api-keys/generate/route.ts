import { NextResponse } from "next/server";
import db from '@/lib/db';
import { generateApiKey, hashApiKey } from "@/utils/generateAPIKey";
import { getUserFromRequest } from "@/lib/auth";


export async function POST(request: Request) {
    try {
        const user = getUserFromRequest(request as any);

        if (!user) {
            console.error("Unauthorized: No user found in request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userPublicKey, keyName } = await request.json();

        if (userPublicKey && userPublicKey.toLowerCase() !== user.address.toLowerCase()) {
            console.error("Unauthorized: User public key does not match authenticated user");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKey = generateApiKey();
        const apiKeyHash = hashApiKey(apiKey);

        // save the hashed API key to the database
        await db.aPIKey.create({
            data: {
                keyHash: apiKeyHash,
                KeyName: keyName || "Default Key Name",
                KeyStartingCharacter: apiKey.substring(0, 4), // Store the starting characters for reference
                userPublicKey: user.address, // always store address from verified token
            },
        });

        return NextResponse.json({ apiKey });
    } catch (error) {
        console.error("Error generating API key:", error);
        return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
    }
}
