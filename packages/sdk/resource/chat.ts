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

    console.log("Job created with ID:", jobId);

    return jobId;
  }

  // subcribe to pubsub channel to get response stream for the jobId and yield each chunk as it arrives
  private async *streamResponse(jobId: string) {
    const redis = await getRedisClient();
    const channel = `stream:${jobId}`;

    const subscriber = redis.duplicate();
    await subscriber.connect();

    const queue: any[] = [];
    let resolve: (() => void) | null = null;
    let done = false;

    console.log(`Subscribing to Redis channel: ${channel} for job ID: ${jobId}`);
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
      while (!done || queue.length > 0) {
        if (queue.length === 0) {
          await new Promise<void>((res) => (resolve = res));
        }

        while (queue.length > 0) {
          const item = queue.shift();
          yield item;
        }
      }
    } finally {
      await subscriber.unsubscribe(channel);
      await subscriber.quit();
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
