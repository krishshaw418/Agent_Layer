import axios from "axios";
import { AgentLayerClient } from "../core/client";

export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  strategy?: "latency" | "cost" | "balanced";
  metadata?: Record<string, any>;
}

export class ChatResource {
  constructor(private client: AgentLayerClient) {}

  completions = {
    create: async (request: ChatCompletionRequest) => {
      const jobId = await this.createJob(request);

      if (request.stream) {
        return this.streamResponse(jobId);
      }

      return this.collectResponse(jobId);
    },
  };

  private async createJob(request: ChatCompletionRequest): Promise<string> {
    const response = await axios.post(
      `${this.client.baseUrl}/chat/`,
      request,
      {
        headers: {
          Authorization: `Bearer ${this.client.apiKey}`,
        },
      },
    );

    return response.data.job_id;
  }

  private async *streamResponse(jobId: string) {
    const response = await fetch(
      `${this.client.baseUrl}/chat/stream?job_id=${jobId}?apiKey=${this.client.apiKey}`
    );

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // split by newline (assuming NLDJSON format)
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed = JSON.parse(line);

          if (parsed.error) {
            throw new Error(parsed.error.message);
          }

          yield parsed;

          if (parsed.done) return;

        } catch (err) {
          console.error("Parse error:", err);
        }
      }
    }
  }

  private async collectResponse(jobId: string): Promise<string> {
    const stream = this.streamResponse(jobId);

    let final = "";

    for await (const chunk of stream) {
      final += chunk.choices?.[0]?.delta?.content || "";
    }

    return final;
  }
}
