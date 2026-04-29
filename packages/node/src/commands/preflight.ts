import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";

import { checkModel, getModelInfo, generate, OLLAMA_HOST } from "../../utils/ollama.js";
import {
  classifyTask,
  estimateOutputTokens,
  analyzeContextFit,
  parseContextWindow,
} from "../../utils/tokens.js";
import { runWarmupProbe, estimateTime, formatDuration } from "../../probes/warmup.js";
import { runAccuracyProbe, adjustAccuracyScore } from "../../probes/accuracy.js";
import { renderReport, renderBidSummary, renderCapabilityError } from "../../utils/report.js";
import { buildBid, buildDiagnostics, writeBid } from "../../utils/bid.js";
import { loadJob, buildPromptFromJob, estimateInputTokensFromJob } from "../../utils/job.js";
import { checkCapabilities } from "../../utils/capability.js";
import type { PreflightOptions } from "../../types.js";

const dim    = chalk.gray;
const good   = chalk.hex("#4ade80");
const bad    = chalk.hex("#f87171");
const warn   = chalk.hex("#facc15");
const accent = chalk.hex("#a78bfa");
const lbl    = chalk.hex("#7dd3fc");

// Main command

// Overloads
// When called from the CLI, pass a file path string.
// When called programmatically, pass a Job object directly.
export async function preflightCommand(model: string, job: import("../../types.js").Job, opts: PreflightOptions): Promise<import("../../types.js").Bid | null>;
export async function preflightCommand(model: string, jobFile: string, opts: PreflightOptions): Promise<import("../../types.js").Bid | null>;
export async function preflightCommand(
  model: string,
  jobOrFile: string | import("../../types.js").Job,
  opts: PreflightOptions,
): Promise<import("../../types.js").Bid | null> {
  console.log();
  console.log(accent("  ⚡ ollama-preflight") + dim(" — estimating before you commit"));
  console.log();

  // Load & validate job
  let job: import("../../types.js").Job;

  // Spinner is hoisted here so it's available throughout the function
  const spinner = ora({ color: "cyan" });

  if (typeof jobOrFile === "string") {
    // CLI path: load from file
    spinner.start(dim(`Loading job from ${jobOrFile}…`));
    const jobResult = await loadJob(jobOrFile);

    if (!jobResult.ok) {
      spinner.fail(bad(`Job file error: ${jobResult.error}`));
      process.exit(1);
    }

    job = jobResult.job;
    spinner.succeed(good(`Job loaded → ${job.job_id}`) + dim(`  task: ${job.task.type}`));
  } else {
    // Programmatic path: job object passed directly from worker
    // No spinner needed — caller already knows the job
    job = jobOrFile;
    console.log(good(`  Job → ${job.job_id}`) + dim(`  task: ${job.task.type}`));
  }

  console.log(
    dim(`  input type: ${job.task.input.type}`) +
    (job.task.input.mime ? dim(` · mime: ${job.task.input.mime}`) : "") +
    (job.task.input.size_bytes ? dim(` · size: ${(job.task.input.size_bytes / 1024).toFixed(1)} KB`) : "")
  );
  console.log();

  // Daemon & model health check
  spinner.start(dim("Checking Ollama daemon…"));
  const modelStatus = await checkModel(model);

  if (!modelStatus.running) {
    spinner.fail(bad(`Model "${model}" is not available.`));
    if (modelStatus.allModels?.length) {
      console.log(dim("\n  Available models:"));
      for (const m of modelStatus.allModels) console.log(dim(`    • ${m}`));
    } else if (!("error" in modelStatus)) {
      console.log(dim(`\n  No models found. Run: ollama pull ${model}`));
    } else {
      console.log(bad(`\n  Could not reach Ollama at ${OLLAMA_HOST}`));
      console.log(dim("  Make sure Ollama is running: ollama serve"));
    }
    process.exit(1);
  }

  spinner.succeed(good(`Model "${model}" is loaded and ready`));

  // Model metadata
  spinner.start(dim("Fetching model info…"));
  const modelInfo     = await getModelInfo(model);
  const contextWindow = parseContextWindow(modelInfo);
  const capabilities  = modelInfo?.capabilities ?? [];
  spinner.succeed(
    dim(`Context window: ${contextWindow != null ? contextWindow.toLocaleString() + " tokens" : "unknown"}`) +
    dim(`  ·  capabilities: [${capabilities.length ? capabilities.join(", ") : "none returned"}]`)
  );

  // Capability check
  // If the model can't serve the task, exit immediately — no bid is created.
  spinner.start(dim("Checking model capabilities against task requirements…"));
  const capCheck = checkCapabilities(job.task.type, job.task.input, capabilities);

  if (!capCheck.ok) {
    spinner.fail(bad("Capability mismatch — bid will not be placed"));
    renderCapabilityError(model, job, capCheck);
    return null;   // no bid — capability mismatch
  }

  spinner.succeed(good(`Capabilities satisfied: [${capCheck.required.join(", ")}]`));

  // Build prompt & estimate input tokens
  const prompt      = buildPromptFromJob(job.task);
  const inputTokens = estimateInputTokensFromJob(job.task);
  const taskType    = classifyTask(prompt);

  // Apply job constraint
  const maxTokenConstraint = job.constraints?.max_token ?? null;
  const rawOutputEst       = estimateOutputTokens(inputTokens, taskType);
  const estimatedOutput    = maxTokenConstraint != null
    ? Math.min(rawOutputEst, maxTokenConstraint)
    : rawOutputEst;

  const contextFit = analyzeContextFit(inputTokens, estimatedOutput, contextWindow);

  // Warm-up probe
  spinner.start(dim("Running warm-up probe (1 token)…"));
  const probe = await runWarmupProbe(model);

  if (probe.ok) {
    spinner.succeed(dim(`Generation speed: ${probe.tokensPerSec ?? "?"} tok/s`));
  } else {
    spinner.warn(warn("Warm-up probe failed — time estimates will be unavailable"));
  }

  // Deadline feasibility check
  if (job.constraints?.deadline != null && probe.ok) {
    const timeEst = estimateTime(inputTokens, estimatedOutput, probe);
    const deadlineMs = job.constraints.deadline;

    if (timeEst.estimatedMs != null && timeEst.estimatedMs > deadlineMs) {
      console.log();
      console.log(bad("  ✘  DEADLINE NOT MET — bid will not be placed"));
      console.log();
      console.log(`${dim("  Estimated time")}  ${chalk.white(formatDuration(timeEst.estimatedMs))}`);
      console.log(`${dim("  Job deadline  ")}  ${chalk.white(formatDuration(deadlineMs))}`);
      console.log();
      console.log(dim("  This node cannot complete the task within the required deadline."));
      console.log(dim("  No bid.json has been written.\n"));
      return null;
    }
  }

  // Accuracy probe
  let accuracyEst = adjustAccuracyScore(null, taskType, contextFit);

  if (!opts.skipAccuracy) {
    spinner.start(dim("Running accuracy probe (meta-prompt)…"));
    const accuracyProbe = await runAccuracyProbe(model, prompt);

    if (accuracyProbe.ok && accuracyProbe.score != null) {
      spinner.succeed(dim(`Model self-assessment: ${accuracyProbe.score}/10`));
      accuracyEst = adjustAccuracyScore(accuracyProbe.score, taskType, contextFit);
    } else {
      spinner.warn(warn("Accuracy probe returned no usable score — using heuristics"));
    }
  }

  // Compile estimates
  const timeEst  = estimateTime(inputTokens, estimatedOutput, probe);
  const tokenEst = {
    input:          inputTokens,
    output:         estimatedOutput,
    total:          inputTokens + estimatedOutput,
    contextPercent: contextFit.percent,
  };

  const reportInput = {
    modelName: model, modelInfo, probe,
    inputTokens, taskType, contextFit,
    timeEst, tokenEst, accuracyEst,
  };

  // Render terminal report
  renderReport(reportInput);

  // Build & write bid.json and bid.diagnostics.json
  spinner.start(dim("Writing bid files…"));
  const bid         = buildBid(reportInput, job.job_id);
  const diagnostics = buildDiagnostics(reportInput, job.job_id, probe);
  const { bidPath, diagnosticsPath } = await writeBid(bid, diagnostics, process.cwd());
  spinner.succeed(good("Bid files written"));

  renderBidSummary(bid, diagnostics, bidPath, diagnosticsPath);

  // Optionally execute
  if (diagnostics.verdict === "reject" && !opts.yes) {
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([{
      type:    "confirm",
      name:    "proceed",
      message: chalk.hex("#f87171")("Bid verdict is REJECT. Run anyway?"),
      default: false,
    }]);
    if (!proceed) {
      console.log(dim("\n  Request cancelled.\n"));
      return bid;
    }
  }

  if (opts.yes) {
    await executeRequest(model, prompt);
    return bid;
  }

  if (!opts.estimateOnly) {
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([{
      type:    "confirm",
      name:    "proceed",
      message: chalk.white("Run the actual request now?"),
      default: false,
    }]);

    if (proceed) await executeRequest(model, prompt);
    else console.log(dim("\n  Request cancelled. No tokens were burned.\n"));
  }

  return bid;
}

// Execute real request
async function executeRequest(model: string, prompt: string): Promise<void> {
  console.log();
  const spinner = ora({ text: chalk.white("Running your request…"), color: "cyan" }).start();

  try {
    const result     = await generate(model, prompt);
    const elapsedMs  = (result.total_duration ?? 0) / 1_000_000;
    const elapsedSec = (elapsedMs / 1_000).toFixed(1);

    spinner.succeed(good(`Done in ${elapsedSec}s`));

    console.log();
    console.log(lbl("  RESPONSE"));
    console.log(dim("  " + "─".repeat(54)));
    console.log();

    for (const line of (result.response ?? "").split("\n")) {
      console.log("  " + line);
    }

    console.log();
    console.log(dim("  " + "─".repeat(54)));
    console.log(
      dim(`  Actual: ${result.eval_count ?? "?"} output tokens`) +
      dim(`  │  ${elapsedSec}s total`)
    );
    console.log();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(bad("Request failed: " + message));
    process.exit(1);
  }
}