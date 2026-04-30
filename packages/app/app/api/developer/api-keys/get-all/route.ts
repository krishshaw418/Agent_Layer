import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import db from '@/lib/db';


export async function GET(request: Request) {
    try {
        const user = getUserFromRequest(request as any);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const apiKeys = await db.aPIKey.findMany({
            where: { userPublicKey: user.address, revoked: false },
            select: { id: true, KeyName: true, KeyStartingCharacter: true, createdAt: true }
        });

        return NextResponse.json({ apiKeys });
    } catch (error) {
        console.error("Error fetching API keys:", error);
        return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
    }
}
