import { NextRequest } from "next/server";
import { AgentLayerClient } from "@agent_layer/sdk";
import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, prompt, strategy, temperature, max_tokens } = await req.json();

    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 400 });

    const client = new AgentLayerClient(apiKey, BACKEND_URL + "/api");

    let stream: any;
    try {
      stream = await client.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant" },
          { role: "user", content: prompt },
        ],
        strategy: strategy || "balanced",
        temperature: temperature !== undefined ? Number(temperature) : undefined,
        max_tokens: max_tokens !== undefined ? Number(max_tokens) : undefined,
        stream: true,
      });
    } catch (err: any) {
      console.error("Error creating chat completion job:", err);
      return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500 });
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        // If the SDK returns an async iterable (streaming), iterate safely and
        // ensure we stop the iterator on error so the SDK cannot retry implicitly.
        if (stream && typeof stream[Symbol.asyncIterator] === "function") {
          const iterator = stream[Symbol.asyncIterator]();
          try {
            while (true) {
              const res = await iterator.next();
              if (res.done) break;
              const chunk = res.value;
              const content = chunk?.choices?.[0]?.delta?.content || "";
              if (content) controller.enqueue(new TextEncoder().encode(content));
            }
          } catch (err: any) {
            // Attempt to terminate the iterator gracefully and then surface the error.
            try {
              if (typeof iterator.return === "function") {
                await iterator.return();
              }
            } catch (e) {
              // ignore
            }
            controller.error(err);
            return;
          } finally {
            controller.close();
          }
        } else {
          // Non-streaming response: try to handle it defensively.
          try {
            const result = await stream;
            const content = result?.choices?.[0]?.delta?.content || result?.choices?.[0]?.message?.content || String(result || "");
            if (content) controller.enqueue(new TextEncoder().encode(content));
          } catch (err: any) {
            controller.error(err);
            return;
          }
          controller.close();
        }
      },
      async cancel(reason) {
        // If the client provided an async iterator, try to close it when the
        // ReadableStream is cancelled from the client side.
        try {
          if (stream && typeof stream[Symbol.asyncIterator] === "function") {
            const it = stream[Symbol.asyncIterator]();
            if (typeof it.return === "function") {
              await it.return();
            }
          }
        } catch (e) {
          // ignore cancellation errors
        }
      }
    });

    return new Response(readableStream, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: any) {
    console.error("Error in /playground/sdk-chat route:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
