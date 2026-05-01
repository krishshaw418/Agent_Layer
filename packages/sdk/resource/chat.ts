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
    const ws = new WebSocket(
      `${this.client.baseUrl.replace(/^http/, "ws")}/chat/stream?job_id=${jobId}&api_key=${this.client.apiKey}`,
    );

    const queue: any[] = [];
    let done = false;
    let error: any = null;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      queue.push(data);

      if (data.done) done = true;
      if (data.error) error = data.error;
    };

    while (!done || queue.length > 0) {
      if (error) throw new Error(error.message);

      if (queue.length > 0) {
        yield queue.shift();
      } else {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    ws.close();
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
