import { NextRequest } from "next/server";
import { AgentLayerClient } from "@agent_layer/sdk";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, input, max_tokens } = await req.json();

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 400 });

    const client = new AgentLayerClient(apiKey, "http://localhost:3000/api");

    const response = client.token.estimate({
      input,
      max_tokens: max_tokens !== undefined ? Number(max_tokens) : undefined
    });

    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
