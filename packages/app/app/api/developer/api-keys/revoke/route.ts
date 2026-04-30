import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import db from '@/lib/db';


export async function PUT(request: Request) {
    try {
        const user = getUserFromRequest(request as any);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { apiKeyId } = await request.json();

        const apiKey = await db.aPIKey.findUnique({ where: { id: apiKeyId } });

        if (!apiKey) {
            return NextResponse.json({ error: "API key not found" }, { status: 404 });
        }

        // verify that the API key belongs to the authenticated user
        if (apiKey.userPublicKey !== user.address) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await db.aPIKey.update({
            where: { id: apiKeyId },
            data: { revoked: true },
        });

        return NextResponse.json({ message: "API key revoked successfully" });
    } catch (error) {
        console.error("Error revoking API key:", error);
        return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
    }
}
