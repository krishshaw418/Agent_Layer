import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";

import { checkModel, getModelInfo, generate, OLLAMA_HOST } from "../../utils/ollama.js";
import {
  estimateTokens,
  classifyTask,
  estimateOutputTokens,
  analyzeContextFit,
  parseContextWindow,
} from "../../utils/tokens.js";
import { runWarmupProbe, estimateTime, formatDuration } from "../../probes/warmup.js";
import { runAccuracyProbe, adjustAccuracyScore } from "../../probes/accuracy.js";
import { renderReport, renderBidSummary } from "../../utils/report.js";
import { buildBid, buildDiagnostics, writeBid } from "../../utils/bid.js";
import type { PreflightOptions } from "../../types.js";

const dim    = chalk.gray;
const good   = chalk.hex("#4ade80");
const bad    = chalk.hex("#f87171");
const warn   = chalk.hex("#facc15");
const accent = chalk.hex("#a78bfa");
const lbl    = chalk.hex("#7dd3fc");

// Main command
export async function preflightCommand(
  model: string,
  prompt: string,
  opts: PreflightOptions,
  jobId: string
): Promise<void> {
  console.log();
  console.log(accent("  ⚡ ollama-preflight") + dim(" — estimating before you commit"));
  console.log(dim(`  job: ${jobId}`));
  console.log();

  // Daemon & model health check
  const spinner = ora({ text: dim("Checking Ollama daemon…"), color: "cyan" }).start();
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
  spinner.succeed(
    dim(`Context window: ${contextWindow != null ? contextWindow.toLocaleString() + " tokens" : "unknown"}`)
  );

  // Local prompt analysis
  const inputTokens     = estimateTokens(prompt);
  const taskType        = classifyTask(prompt);
  const estimatedOutput = estimateOutputTokens(inputTokens, taskType);
  const contextFit      = analyzeContextFit(inputTokens, estimatedOutput, contextWindow);

  // Warm-up probe
  spinner.start(dim("Running warm-up probe (1 token)…"));
  const probe = await runWarmupProbe(model);

  if (probe.ok) {
    spinner.succeed(dim(`Generation speed: ${probe.tokensPerSec ?? "?"} tok/s`));
  } else {
    spinner.warn(warn("Warm-up probe failed — time estimates will be unavailable"));
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
  const bid         = buildBid(reportInput, jobId);
  const diagnostics = buildDiagnostics(reportInput, jobId, probe);
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
      return;
    }
  }

  if (opts.yes) {
    await executeRequest(model, prompt);
    return;
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
}

// Execute real request
async function executeRequest(model: string, prompt: string): Promise<void> {
  console.log();
  const spinner = ora({ text: chalk.white("Running your request…"), color: "cyan" }).start();
  const start   = Date.now();

  try {
    const result  = await generate(model, prompt);
    const elapsed = Date.now() - start;

    spinner.succeed(good(`Done in ${(elapsed / 1_000).toFixed(1)}s`));

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
      dim(`  │  ${formatDuration(elapsed)} total`)
    );
    console.log();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(bad("Request failed: " + message));
    process.exit(1);
  }
}