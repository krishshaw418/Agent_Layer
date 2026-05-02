import { NextRequest } from "next/server";
import { AgentLayerClient } from "@agent_layer/sdk";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, input, model } = await req.json();

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 400 });

    const client = new AgentLayerClient(apiKey, "http://localhost:3000/api");

    const response = await client.embeddings.create({
      input: [input],
      model: model || "agent-embed-1"
    });

    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
