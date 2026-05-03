import axios from "axios";
import { AgentLayerClient } from "../core/client";
import { getRedisClient } from "../utils/redis";

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

  // subcribe to pubsub channel to get response stream for the jobId and yield each chunk as it arrives and end the pubsub connection when the job is done (indicated by a special message or signal)
  private async *streamResponse(jobId: string) {
    const redis = await getRedisClient();
    const channel = `stream:${jobId}`;
    const timeoutMs = 180_000;

    const subscriber = redis.duplicate();
    await subscriber.connect();

    const queue: any[] = [];
    let resolve: (() => void) | null = null;
    let done = false;
    let terminalError: Error | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    let completedSuccessfully = false;

    timeoutHandle = setTimeout(() => {
      terminalError = new Error(`Chat request timed out after ${timeoutMs / 1000} seconds`);
      done = true;

      if (resolve) {
        resolve();
        resolve = null;
      }
    }, timeoutMs);

    // console.log(`Subscribing to Redis channel: ${channel} for job ID: ${jobId}`);
    await subscriber.subscribe(channel, (message) => {
      // console.log(`Received message on channel ${channel}:`, message);
      // END signal
      if (message === "__END__") {
        done = true;

        if (resolve) {
          resolve();
          resolve = null;
        }
        return;
      }

      if (message === "__JOB_FAILED__") {
        terminalError = new Error(`Chat request failed for job ${jobId}`);
        done = true;

        if (resolve) {
          resolve();
          resolve = null;
        }
        return;
      }

      // Each message is a raw text chunk
      queue.push({
        choices: [
          {
            delta: {
              content: message,
            },
          },
        ],
      });

      if (resolve) {
        resolve();
        resolve = null;
      }
    });

    try {
      while (true) {
        if (queue.length === 0) {
          if (terminalError) {
            throw terminalError;
          }

          if (done) break;

          await new Promise<void>((res) => (resolve = res));
        }

        while (queue.length > 0) {
          const item = queue.shift();
          yield item;
        }

        if (terminalError) {
          throw terminalError;
        }

        if (done && queue.length === 0) break;
      }

      completedSuccessfully = true;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      if (completedSuccessfully) {
        void this.markJobCompleted(jobId);
      }

      await subscriber.unsubscribe(channel);
      await subscriber.quit();
      // console.log(`Unsubscribed and closed Redis connection for channel: ${channel}`);
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
