import { AgentLayerClient } from "../core/client";
import { Tokenizer } from "../utils/tokenizer";
import { ChatMessage } from "./chat";

export interface TokenEstimateRequest {
  messages?: ChatMessage[];
  input?: string | string[];
  max_tokens?: number;
}

export interface TokenEstimateResponse {
  prompt_tokens: number;
  estimated_completion_tokens?: number;
  total_tokens: number;
}

export class TokenResource {
  constructor (private client: AgentLayerClient) {}

  estimate(request: TokenEstimateRequest): TokenEstimateResponse {
    if (request.messages && request.input) {
      throw new Error("Provide either 'messages' or 'input', not both");
    }

    let prompt_tokens = 0;

    if (request.messages) {
      prompt_tokens = Tokenizer.estimateFromMessages(request.messages);
    } else if (request.input) {
      const inputs = Array.isArray(request.input)
        ? request.input
        : [request.input];

      prompt_tokens = inputs.reduce(
        (acc, text) => acc + Tokenizer.estimateFromText(text),
        0
      );
    } else {
      throw new Error("Either 'messages' or 'input' must be provided");
    }

    if (prompt_tokens === 0) {
      throw new Error("Input text is empty");
    }

    const SAFETY_FACTOR = 1.2;
    prompt_tokens = Math.ceil(prompt_tokens * SAFETY_FACTOR);

    const estimated_completion_tokens =
      request.max_tokens ?? Math.ceil(prompt_tokens * 1.5);

    return {
      prompt_tokens,
      estimated_completion_tokens,
      total_tokens: prompt_tokens + estimated_completion_tokens,
    };
  }
}