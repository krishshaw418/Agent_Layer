import fs from "node:fs/promises";
import path from "node:path";
import { formatDuration } from "../probes/warmup.js";
import type {
  AccuracyEstimate,
  Bid,
  BidDiagnostics,
  ContextFitResult,
  ReportInput,
  TimeEstimate,
  TokenEstimate,
  WarmupProbeResult,
} from "../types.js";

// Confidence conversion
function computeConfidence(
  accuracyEst: AccuracyEstimate,
  timeEst: TimeEstimate,
  contextFit: ContextFitResult
): number {
  let confidence = (accuracyEst.score ?? 6) / 10;

  // Penalise for context issues
  if (contextFit.grade === "overflow") confidence -= 0.3;
  else if (contextFit.grade === "tight") confidence -= 0.1;

  // Penalise for low time estimate confidence
  if (timeEst.confidence === "low") confidence -= 0.1;
  else if (timeEst.confidence === "medium") confidence -= 0.05;

  // Clamp to [0.0, 1.0]
  return Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100;
}

// Verdict logic
// Produces a top-level "accept" | "caution" | "reject" based on all signals.
function computeVerdict(
  accuracyEst: AccuracyEstimate,
  timeEst: TimeEstimate,
  tokenEst: TokenEstimate,
  contextFit: ContextFitResult
): { verdict: BidDiagnostics["verdict"]; reasons: string[] } {
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

// To build on-chain bid
export function buildBid(input: ReportInput, jobId: string): Bid {
  const { modelName, timeEst, tokenEst, accuracyEst, contextFit } = input;

  const confidence = computeConfidence(accuracyEst, timeEst, contextFit);

  return {
    job_id:        jobId,
    placed_at:     Math.floor(Date.now() / 1000),   // unix seconds
    token:         tokenEst.total,
    time_requires: timeEst.estimatedMs ?? 0,
    confidence,
    model:         modelName,
  };
}

// To build diagnostics
export function buildDiagnostics(
  input: ReportInput,
  jobId: string,
  probe: WarmupProbeResult
): BidDiagnostics {
  const { taskType, contextFit, timeEst, tokenEst, accuracyEst } = input;
  const { verdict, reasons } = computeVerdict(accuracyEst, timeEst, tokenEst, contextFit);

  return {
    job_id:       jobId,
    generated_at: new Date().toISOString(),
    task_type:    taskType.type,
    task_label:   taskType.label,

    tokens: {
      input:                tokenEst.input,
      output_estimated:     tokenEst.output,
      total_estimated:      tokenEst.total,
      context_window:       contextFit.contextWindow ?? null,
      context_used_percent: tokenEst.contextPercent,
    },

    time: {
      estimated_ms:          timeEst.estimatedMs,
      prompt_processing_ms:  timeEst.promptMs ?? null,
      token_generation_ms:   timeEst.evalMs   ?? null,
      time_confidence:       timeEst.confidence,
    },

    accuracy: {
      score:       accuracyEst.score,
      confidence:  accuracyEst.confidence,
      context_fit: contextFit.grade,
    },

    hardware: {
      generation_tokens_per_sec: probe.ok ? probe.tokensPerSec     : null,
      prompt_tokens_per_sec:     probe.ok ? probe.promptTokPerSec  : null,
    },

    verdict,
    verdict_reasons: reasons,
  };
}

// Writing bid to a bid.json and a bid.diagnostic.json file
export async function writeBid(
  bid: Bid,
  diagnostics: BidDiagnostics,
  outputDir = "."
): Promise<{ bidPath: string; diagnosticsPath: string }> {
  const bidPath         = path.resolve(outputDir, "bid.json");
  const diagnosticsPath = path.resolve(outputDir, "bid.diagnostics.json");

  await Promise.all([
    fs.writeFile(bidPath,         JSON.stringify(bid,         null, 2), "utf-8"),
    fs.writeFile(diagnosticsPath, JSON.stringify(diagnostics, null, 2), "utf-8"),
  ]);

  return { bidPath, diagnosticsPath };
}