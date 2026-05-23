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

    const jobId = response.data.id;

    // console.log("Job created with ID:", jobId);

    return jobId;
  }

  private async markJobCompleted(jobId: string): Promise<void> {
    try {
      await axios.post(
        `${this.client.baseUrl}/mark-job-completed`,
        { jobId },
        {
          headers: {
            Authorization: `Bearer ${this.client.apiKey}`,
          },
        },
      );
    } catch {
      // Completion notification should never block the chat response.
    }
  }

  private async *streamResponse(jobId: string) {
    // const wsUrl = `wss://a23e-45-113-103-56.ngrok-free.app?type=user`;
    const wsUrl = `wss://api.node-gateway.amethsyt.xyz?type=user`;
    const timeoutMs = 180_000;

    const queue: any[] = [];
    let resolve: (() => void) | null = null;
    let done = false;
    let terminalError: Error | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let completedSuccessfully = false;

    const ws = new WebSocket(wsUrl);

    timeoutHandle = setTimeout(() => {
      terminalError = new Error(`Chat request timed out after ${timeoutMs / 1000} seconds`);
      done = true;
      ws.close();
      if (resolve) { resolve(); resolve = null; }
    }, timeoutMs);

    ws.onmessage = (event) => {
      let parsed: { event: string; data: string };

      try {
        parsed = JSON.parse(event.data);
      } catch {
        return; // skip malformed messages
      }

      if (parsed.event === "end" || parsed.event === "__END__" || parsed.data === "__END__") {
        done = true;
        ws.close();
        if (resolve) { resolve(); resolve = null; }
        return;
      }

      if (parsed.event === "error" || parsed.event === "err") {
        terminalError = new Error(`Chat request failed for job ${jobId}`);
        done = true;
        ws.close();
        if (resolve) { resolve(); resolve = null; }
        return;
      }

      if (parsed.event === "response") {
        queue.push({
          choices: [{ delta: { content: parsed.data } }],
        });
        if (resolve) { resolve(); resolve = null; }
      }
    };

    ws.onerror = (err) => {
      terminalError = new Error(`WebSocket error for job ${jobId}`);
      done = true;
      if (resolve) { resolve(); resolve = null; }
    };

    ws.onclose = () => {
      if (!done) {
        done = true;
        if (resolve) { resolve(); resolve = null; }
      }
    };

    // Wait for the socket to open, then subscribe to the job response
    await new Promise<void>((res, rej) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({
        event: "subscribe_to_response",
        data: { jobId },
      }));
      // Restore the real error handler now that we're connected
      ws.onerror = () => {
        terminalError = new Error(`WebSocket error for job ${jobId}`);
        done = true;
        if (resolve) { resolve(); resolve = null; }
      };
      res();
    };
    ws.onerror = () => rej(new Error("WS failed to open"));
  });

    try {
      while (true) {
        if (queue.length === 0) {
          if (terminalError) throw terminalError;
          if (done) break;
          await new Promise<void>((res) => (resolve = res));
        }

        while (queue.length > 0) {
          yield queue.shift();
        }

        if (terminalError) throw terminalError;
        if (done && queue.length === 0) break;
      }

      completedSuccessfully = true;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      if (completedSuccessfully) void this.markJobCompleted(jobId);
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
