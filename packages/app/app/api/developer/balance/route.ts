import { NextResponse } from "next/server";
import db from '@/lib/db';
import { hashApiKey } from "@/utils/generateAPIKey";
import { getVaultBalanceOnChain } from "@/utils/userOnChainHandlers";
import { signer } from "@/lib/blockChain";

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

    // get vault balance for user associated with api key
    const userPublicKey = validKey.userPublicKey;
    const vaultBalance = await getVaultBalanceOnChain(userPublicKey, signer);
    
    if (!vaultBalance.success) {
        return NextResponse.json({ error: vaultBalance.error }, { status: 500 });
    }

    return NextResponse.json({ balance: vaultBalance.data });
  } catch (error) {
    console.error("Error in balance route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
