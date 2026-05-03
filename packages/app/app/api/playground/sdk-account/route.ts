import { NextRequest } from "next/server";
import { AgentLayerClient } from "@agent_layer/sdk";
import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json();

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 400 });

    const client = new AgentLayerClient(apiKey, BACKEND_URL + "/api");

    const response = await client.account.balance();

    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
