import chalk from "chalk";
import { formatDuration } from "../probes/warmup.js";
import type {
  AccuracyEstimate,
  Bid,
  BidDiagnostics,
  ConfidenceLevel,
  ContextFitResult,
  ContextGrade,
  OllamaShowResponse,
  ReportInput,
  TaskClassification,
  TimeEstimate,
  TokenEstimate,
  WarmupProbeResult,
} from "../types.js";

// Colour helpers
const dim    = chalk.gray;
const lbl    = chalk.hex("#7dd3fc");
const good   = chalk.hex("#4ade80");
const warn   = chalk.hex("#facc15");
const bad    = chalk.hex("#f87171");
const accent = chalk.hex("#a78bfa");
const b      = chalk.bold;
const white  = chalk.white;

function gradeColor(grade: ContextGrade): string {
  const map: Record<ContextGrade, (s: string) => string> = {
    excellent: good,
    good:      good,
    tight:     warn,
    overflow:  bad,
    unknown:   dim,
  };
  return (map[grade] ?? dim)(grade);
}

function confidenceColor(c: ConfidenceLevel): string {
  const map: Record<ConfidenceLevel, (s: string) => string> = {
    high:    good,
    medium:  warn,
    low:     bad,
    unknown: dim,
  };
  return (map[c] ?? dim)(c);
}

function usageBar(percent: number | null, width = 24): string {
  if (percent == null) return dim("░".repeat(width) + " ??%");
  const filled = Math.round((percent / 100) * width);
  const empty  = width - filled;
  const color  = percent < 60 ? good : percent < 85 ? warn : bad;
  return color("█".repeat(filled)) + dim("░".repeat(empty)) + ` ${percent}%`;
}

function accuracyBar(percent: number | null, width = 24): string {
  if (percent == null) return dim("░".repeat(width) + " ??%");
  const filled = Math.round((percent / 100) * width);
  const empty  = width - filled;
  const color  = percent >= 70 ? good : percent >= 40 ? warn : bad;
  return color("█".repeat(filled)) + dim("░".repeat(empty)) + ` ${percent}%`;
}

// Section renderers
function renderHeader(modelName: string): void {
  const line = dim("─".repeat(56));
  console.log();
  console.log(line);
  console.log(accent("  ⚡ OLLAMA PREFLIGHT  ") + dim("│") + "  " + b(white(modelName)));
  console.log(line);
}

function renderModelStatus(
  _modelInfo: OllamaShowResponse | null,
  probe: WarmupProbeResult
): void {
  console.log();
  console.log(lbl("  MODEL STATUS"));
  console.log();

  const speedStr =
    probe.ok && probe.tokensPerSec != null
      ? good(`${probe.tokensPerSec} tok/s`)
      : bad("unavailable");

  const ingestStr =
    probe.ok && probe.promptTokPerSec != null
      ? white(`${probe.promptTokPerSec} tok/s`)
      : dim("n/a");

  const rows: [string, string][] = [
    ["  Status",              good("● loaded & ready")],
    ["  Generation speed",    speedStr],
    ["  Prompt ingest speed", ingestStr],
  ];

  for (const [k, v] of rows) {
    console.log(`${dim(k.padEnd(28))}${v}`);
  }
}

function renderPromptAnalysis(
  inputTokens: number,
  taskType: TaskClassification,
  contextFit: ContextFitResult
): void {
  console.log();
  console.log(lbl("  PROMPT ANALYSIS"));
  console.log();

  const fitStr =
    gradeColor(contextFit.grade) +
    (contextFit.percent != null ? dim(` (${contextFit.percent}% of context used)`) : "");

  const rows: [string, string][] = [
    ["  Input tokens", white(inputTokens.toLocaleString())],
    ["  Task type",    accent(taskType.label)],
    ["  Context fit",  fitStr],
  ];

  for (const [k, v] of rows) {
    console.log(`${dim(k.padEnd(28))}${v}`);
  }
}

function renderEstimates(
  timeEst: TimeEstimate,
  tokenEst: TokenEstimate,
  accuracyEst: AccuracyEstimate
): void {
  console.log();
  console.log(lbl("  ESTIMATES"));
  console.log();

  const timeStr  = timeEst.estimatedMs != null ? white(formatDuration(timeEst.estimatedMs)) : dim("unknown");
  const timeConf = confidenceColor(timeEst.confidence);
  console.log(`${dim("  Time to complete".padEnd(28))}${timeStr}  ${dim("confidence:")} ${timeConf}`);

  console.log();
  console.log(dim("  Token burn"));
  console.log(`${dim("    Input  (counted)".padEnd(30))}${white(tokenEst.input.toLocaleString())} tokens`);
  console.log(`${dim("    Output (estimated)".padEnd(30))}${white("~" + tokenEst.output.toLocaleString())} tokens`);
  console.log(`${dim("    Total".padEnd(30))}${b(white("~" + tokenEst.total.toLocaleString()))} tokens`);
  console.log();
  console.log(`  ${dim("Usage:   ")}${usageBar(tokenEst.contextPercent)}`);

  console.log();
  const accScore = accuracyEst.score != null ? `${accuracyEst.score}/10` : "?/10";
  const accConf  = confidenceColor(accuracyEst.confidence);
  console.log(`${dim("  Accuracy / confidence".padEnd(28))}${b(white(accScore))}  ${dim("model confidence:")} ${accConf}`);
  console.log(`  ${dim("Quality: ")}${accuracyBar(accuracyEst.percent)}`);
}

function renderBreakdown(timeEst: TimeEstimate): void {
  if (timeEst.estimatedMs == null) return;

  console.log();
  console.log(lbl("  TIME BREAKDOWN"));
  console.log();

  const overheadMs =
    timeEst.estimatedMs - (timeEst.promptMs ?? 0) - (timeEst.evalMs ?? 0);

  const rows: [string, string][] = [
    ["  Prompt processing",   formatDuration(timeEst.promptMs)],
    ["  Token generation",    formatDuration(timeEst.evalMs)],
    ["  Overhead (est. 2x)",  formatDuration(overheadMs)],
    ["  Total estimate",      formatDuration(timeEst.estimatedMs)],
  ];

  for (const [k, v] of rows) {
    console.log(`${dim(k.padEnd(28))}${white(v)}`);
  }
}

function renderVerdict(diagnostics: BidDiagnostics): void {
  console.log();
  console.log(lbl("  BID VERDICT"));
  console.log();

  const verdictStr =
    diagnostics.verdict === "accept"  ? good("✔  ACCEPT")  :
    diagnostics.verdict === "caution" ? warn("⚠  CAUTION") :
                                        bad("✘  REJECT");

  console.log(`  ${b(verdictStr)}`);
  console.log();

  for (const reason of diagnostics.verdict_reasons) {
    const icon =
      diagnostics.verdict === "accept"  ? dim("  •") :
      diagnostics.verdict === "caution" ? warn("  •") :
                                          bad("  •");
    console.log(`${icon} ${dim(reason)}`);
  }
}



function renderFooter(): void {
  console.log();
  console.log(dim("─".repeat(56)));
  console.log();
}

// Main exports
export function renderReport(input: ReportInput): void {
  const { modelName, modelInfo, probe, inputTokens, taskType, contextFit, timeEst, tokenEst, accuracyEst } = input;

  renderHeader(modelName);
  renderModelStatus(modelInfo, probe);
  renderPromptAnalysis(inputTokens, taskType, contextFit);
  renderEstimates(timeEst, tokenEst, accuracyEst);
  renderBreakdown(timeEst);
  renderFooter();
}

export function renderBidSummary(
  bid: Bid,
  diagnostics: BidDiagnostics,
  bidPath: string,
  diagnosticsPath: string
): void {
  renderVerdict(diagnostics);
  console.log();
  console.log(`  ${dim("bid.json          →")} ${white(bidPath)}`);
  console.log(`  ${dim("bid.diagnostics   →")} ${white(diagnosticsPath)}`);
  console.log();
  console.log(`  ${dim("confidence score  →")} ${white(String(bid.confidence))}  ${dim("token estimate  →")} ${white(String(bid.token))}`);
}

// Capability error renderer
export function renderCapabilityError(
  modelName: string,
  job: import("../types.js").Job,
  capCheck: import("../types.js").CapabilityCheckResult
): void {
  const line = dim("─".repeat(56));
  console.log();
  console.log(line);
  console.log(bad("  ✘  CAPABILITY MISMATCH") + dim("  │  no bid placed"));
  console.log(line);
  console.log();
  console.log(`${dim("  Task ID    ")}  ${white(job.plan.task.task_id)}`);
  console.log(`${dim("  Task type  ")}  ${white(job.plan.task.type)}`);
  console.log(`${dim("  Input type ")}  ${white(job.plan.task.input.type)}`);
  console.log(`${dim("  Input data ")}  ${white(job.plan.task.input.data.slice(0, 60))}`);
  console.log(`${dim("  Model      ")}  ${white(modelName)}`);
  console.log();
  console.log(`${dim("  Required   ")}  ${bad(capCheck.required.join(", "))}`);
  console.log(`${dim("  Available  ")}  ${capCheck.available.length ? good(capCheck.available.join(", ")) : dim("(none returned)")}`);
  console.log(`${dim("  Missing    ")}  ${bad(capCheck.missing.join(", "))}`);
  console.log();
  if (capCheck.reason) {
    console.log(`  ${dim(capCheck.reason)}`);
    console.log();
  }
  console.log(dim("─".repeat(56)));
  console.log();
}