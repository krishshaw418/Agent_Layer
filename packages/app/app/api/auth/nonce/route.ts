import { NextResponse } from "next/server";
import crypto from "crypto";
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicKey = url.searchParams.get("publicKey")?.toLowerCase();
    console.log("Received publicKey:", publicKey);

    if (!publicKey) {
      return NextResponse.json({ error: "Missing publicKey query parameter" }, { status: 400 });
    }

    const nonce = crypto.randomBytes(16).toString("hex");

    // Upsert user and store nonce in DB
    await db.user.upsert({
      where: { publicKey },
      update: { nonce },
      create: { publicKey, nonce },
    });

    return NextResponse.json({ nonce });
  } catch (err) {
    console.error("Error storing nonce:", err);
    return NextResponse.json(
      {
        error: "Failed to store nonce",
        details: err instanceof Error ? err.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}