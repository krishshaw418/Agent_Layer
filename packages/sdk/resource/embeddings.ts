import axios from "axios";
import { AgentLayerClient } from "../core/client";

export interface EmbeddingRequest {
  model?: string;
  input: string[];
}

export interface EmbeddingVector {
  embedding: number[];
  index: number;
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingVector[];
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class EmbeddingResource {
  constructor(private client: AgentLayerClient) {}

  async create(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.client.apiKey) {
      throw new Error("API key is required");
    }

    if (!this.client.baseUrl) {
      throw new Error("Base URL is required");
    }

    try {
      const response = await axios.post(
        `${this.client.baseUrl}/embeddings`,
        request,
        {
          headers: {
            Authorization: `Bearer ${this.client.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = response.data;

      if (data.error) {
        throw new Error(
          data.error.message || "Embedding request failed"
        );
      }

      return data as EmbeddingResponse;
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.error?.message ||
        err.message ||
        "Unknown error in embeddings.create"
      );
    }
  }
}