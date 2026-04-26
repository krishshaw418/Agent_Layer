import { generate } from "../utils/ollama.js";
import type { ConfidenceLevel, TimeEstimate, WarmupProbeResult } from "../types.js";

const PROBE_PROMPT = "Reply with the single word: ready";

// nanoseconds -> milliseconds
function nsToMs(ns: number | undefined): number | null {
  return ns != null ? ns / 1_000_000 : null;
}

// Probe To measure real hardware speed of the machine on which the model is running
export async function runWarmupProbe(modelName: string): Promise<WarmupProbeResult> {
  const wallStart = Date.now();

  try {
    const result = await generate(modelName, PROBE_PROMPT, {
      num_predict: 1,
      temperature: 0,
    });

    const wallMs = Date.now() - wallStart;

    const promptEvalMs = nsToMs(result.prompt_eval_duration);
    const evalMs = nsToMs(result.eval_duration);
    const totalMs = nsToMs(result.total_duration) ?? wallMs;

    const promptTokens = result.prompt_eval_count ?? 0;
    const evalTokens = result.eval_count ?? 1;

    const tokensPerSec: number | null =
      evalMs != null && evalMs > 0
        ? Math.round((evalTokens / evalMs) * 1_000)
        : null;

    const promptTokPerSec: number | null =
      promptEvalMs != null && promptEvalMs > 0 && promptTokens > 0
        ? Math.round((promptTokens / promptEvalMs) * 1_000)
        : null;

    return {
      ok: true,
      tokensPerSec,
      promptTokPerSec,
      promptEvalMs,
      evalMs,
      totalMs,
      rawResult: result,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// Time estimation
export function estimateTime(
  inputTokens: number,
  outputTokens: number,
  probe: WarmupProbeResult
): TimeEstimate {
  if (!probe.ok || probe.tokensPerSec == null) {
    return { estimatedMs: null, confidence: "low" };
  }

  const promptMs =
    probe.promptTokPerSec != null
      ? (inputTokens / probe.promptTokPerSec) * 1_000
      : inputTokens * 5; // ~5ms/token fallback

  const evalMs = (outputTokens / probe.tokensPerSec) * 1_000;

  // 15% overhead buffer
  const estimatedMs = Math.ceil((promptMs + evalMs) * 2.0);

  const confidence: ConfidenceLevel = probe.tokensPerSec > 5 ? "high" : "medium";

  return {
    estimatedMs,
    promptMs: Math.ceil(promptMs),
    evalMs: Math.ceil(evalMs),
    confidence,
  };
}

// Duration formatting
export function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "unknown";
  if (ms < 1_000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1_000);
  return `${mins}m ${secs}s`;
}