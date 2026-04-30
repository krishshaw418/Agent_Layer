import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import db from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();

    const siwe = new SiweMessage(message);

    const result = await siwe.verify({ signature });

    if (!result.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const address = result.data.address.toLowerCase();

    const nonce = siwe.nonce || (result.data && (result.data as any).nonce);

    const user = await db.user.findUnique({ where: { publicKey: address } });
    if (!user || user.nonce !== nonce) {
      return NextResponse.json({ error: "Invalid nonce" }, { status: 401 });
    }

    // Invalidate the nonce after successful verification
    await db.user.update({ where: { publicKey: address }, data: { nonce: null } });

    const token = jwt.sign({ address }, JWT_SECRET, {
      expiresIn: "7d",
    });

    const res = NextResponse.json({ ok: true });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}