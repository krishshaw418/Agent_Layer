import { NextResponse } from "next/server";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.NIM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

export interface EmbeddingRequest {
  input: string[];
  input_type?: "query" | "document";
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { input, input_type = "query" } = body as EmbeddingRequest;

        const response = await client.embeddings.create({
            model: "nvidia/llama-3.2-nemoretriever-300m-embed-v1",
            input: input,
            encoding_format: "float",
            input_type: input_type,
        } as any);

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error in embeddings route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
