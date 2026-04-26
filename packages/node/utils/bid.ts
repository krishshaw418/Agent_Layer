import fs from "node:fs/promises";
import path from "node:path";
import { formatDuration } from "../probes/warmup.js";
import type {
  AccuracyEstimate,
  Bid,
  ContextFitResult,
  ReportInput,
  TimeEstimate,
  TokenEstimate,
  WarmupProbeResult,
} from "../types.js";

// Verdict logic
// Produces a top-level "accept" | "caution" | "reject" based on all signals.
function computeVerdict(
  accuracyEst: AccuracyEstimate,
  timeEst: TimeEstimate,
  tokenEst: TokenEstimate,
  contextFit: ContextFitResult
): { verdict: Bid["verdict"]; reasons: string[] } {
  const reasons: string[] = [];
  let rejectCount = 0;
  let cautionCount = 0;

  // Accuracy
  if (accuracyEst.percent != null) {
    if (accuracyEst.percent < 30) {
      reasons.push(`Very low model confidence (${accuracyEst.percent}%)`);
      rejectCount++;
    } else if (accuracyEst.percent < 55) {
      reasons.push(`Moderate model confidence (${accuracyEst.percent}%) — review output carefully`);
      cautionCount++;
    }
  }

  // Context fit
  if (contextFit.grade === "overflow") {
    reasons.push("Prompt + estimated output exceeds context window — response will be truncated");
    rejectCount++;
  } else if (contextFit.grade === "tight") {
    reasons.push(`Context window is ${contextFit.percent}% full — output may be cut short`);
    cautionCount++;
  }

  // Time
  if (timeEst.estimatedMs != null && timeEst.estimatedMs > 120_000) {
    reasons.push(`Estimated time exceeds 2 minutes (${formatDuration(timeEst.estimatedMs)})`);
    cautionCount++;
  }

  // Token burn
  if (tokenEst.total > 4000) {
    reasons.push(`High token usage (~${tokenEst.total.toLocaleString()} tokens total)`);
    cautionCount++;
  }

  if (rejectCount > 0) return { verdict: "reject", reasons };
  if (cautionCount > 0) return { verdict: "caution", reasons };

  reasons.push("All signals within acceptable range");
  return { verdict: "accept", reasons };
}

// To build bid
export function buildBid(input: ReportInput, prompt: string): Bid {
  const { modelName, modelInfo, probe, taskType, contextFit, timeEst, tokenEst, accuracyEst } = input;

  const { verdict, reasons } = computeVerdict(accuracyEst, timeEst, tokenEst, contextFit);

  const hardware = resolveHardware(probe);
  const contextWindow = contextFit.contextWindow ?? null;

  return {
    schema_version: "1.0",
    bid_at: new Date().toISOString(),

    task: {
      prompt_excerpt: prompt.slice(0, 120).replace(/\n/g, " "),
      task_type:      taskType.type,
      task_label:     taskType.label,
    },

    model: {
      name:           modelName,
      parameter_size: modelInfo?.details?.parameter_size ?? null,
      quantization:   modelInfo?.details?.quantization_level ?? null,
      context_window: contextWindow,
    },

    hardware,

    time: {
      estimated_ms:          timeEst.estimatedMs,
      estimated_human:       formatDuration(timeEst.estimatedMs),
      prompt_processing_ms:  timeEst.promptMs ?? null,
      token_generation_ms:   timeEst.evalMs   ?? null,
      confidence:            timeEst.confidence,
    },

    tokens: {
      input:                tokenEst.input,
      output_estimated:     tokenEst.output,
      total_estimated:      tokenEst.total,
      context_window:       contextWindow,
      context_used_percent: tokenEst.contextPercent,
    },

    accuracy: {
      score:       accuracyEst.score,
      percent:     accuracyEst.percent,
      confidence:  accuracyEst.confidence,
      context_fit: contextFit.grade,
    },

    verdict,
    verdict_reasons: reasons,
  };
}

// Writing bid to a bid.json file
export async function writeBid(bid: Bid, outputDir = "."): Promise<string> {
  const filePath = path.resolve(outputDir, "bid.json");
  await fs.writeFile(filePath, JSON.stringify(bid, null, 2), "utf-8");
  return filePath;
}

function resolveHardware(probe: WarmupProbeResult): Bid["hardware"] {
  if (!probe.ok) return { generation_tokens_per_sec: null, prompt_tokens_per_sec: null };
  return {
    generation_tokens_per_sec: probe.tokensPerSec,
    prompt_tokens_per_sec:     probe.promptTokPerSec,
  };
}