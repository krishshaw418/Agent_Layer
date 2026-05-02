import ora from "ora";
import inquirer from "inquirer";
import chalk from "chalk";

import {
  checkModel,
  getModelInfo,
  generate,
  OLLAMA_HOST,
} from "../../utils/ollama.js";
import {
  classifyTask,
  estimateOutputTokens,
  analyzeContextFit,
  parseContextWindow,
} from "../../utils/tokens.js";
import {
  runWarmupProbe,
  estimateTime,
  formatDuration,
} from "../../probes/warmup.js";
import {
  runAccuracyProbe,
  adjustAccuracyScore,
} from "../../probes/accuracy.js";
import {
  renderReport,
  renderBidSummary,
  renderCapabilityError,
} from "../../utils/report.js";
import { buildBid, buildDiagnostics, writeBid } from "../../utils/bid.js";
import {
  loadJob,
  buildPromptFromJob,
  estimateInputTokensFromJob,
} from "../../utils/job.js";
import { checkCapabilities } from "../../utils/capability.js";
import { getJobId, isJobExpired, jobTimeRemainingMs } from "../../types.js";
import type { Job, PreflightOptions, Bid } from "../../types.js";

const dim = chalk.gray;
const good = chalk.hex("#4ade80");
const bad = chalk.hex("#f87171");
const warn = chalk.hex("#facc15");
const accent = chalk.hex("#a78bfa");
const lbl = chalk.hex("#7dd3fc");

// Overloads
// When called from the CLI, pass a file path string.
// When called programmatically, pass a Job object directly.
export async function preflightCommand(
  model: string,
  job: Job,
  opts: PreflightOptions,
): Promise<Bid | null>;
export async function preflightCommand(
  model: string,
  jobFile: string,
  opts: PreflightOptions,
): Promise<Bid | null>;
export async function preflightCommand(
  model: string,
  jobOrFile: string | Job,
  opts: PreflightOptions,
): Promise<Bid | null> {
  console.log();
  console.log(
    accent("  ⚡ ollama-preflight") + dim(" — estimating before you commit"),
  );
  console.log();

  // Load & validate job
  let job: Job;

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
    spinner.succeed(
      good(`Job loaded → ${getJobId(job)}`) +
        dim(`  task: ${job.plan.task.type}`),
    );
  } else {
    // Programmatic path: job object passed directly from worker
    // No spinner needed — caller already knows the job
    job = jobOrFile;
    console.log(
      good(`  Job → ${getJobId(job)}`) + dim(`  task: ${job.plan.task.type}`),
    );
  }

  console.log(
    dim(`  input: ${job.plan.task.input.type}`) +
      dim(
        `  ·  data: ${job.plan.task.input.data.slice(0, 60)}${job.plan.task.input.data.length > 60 ? "…" : ""}`,
      ) +
      (job.plan.context.length > 0
        ? dim(`  ·  context: ${job.plan.context.length} turns`)
        : ""),
  );
  console.log();

  // Deadline check
  if (isJobExpired(job)) {
    console.log(
      bad(
        `  ✘  Job ${getJobId(job)} has already expired — no bid will be placed\n`,
      ),
    );
    return null;
  }

  const remainingMs = jobTimeRemainingMs(job);
  console.log(
    dim(`  ⏱  ${Math.round(remainingMs / 1000)}s remaining until deadline`),
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
  const modelInfo = await getModelInfo(model);
  const contextWindow = parseContextWindow(modelInfo);
  const capabilities = modelInfo?.capabilities ?? [];
  spinner.succeed(
    dim(
      `Context window: ${contextWindow != null ? contextWindow.toLocaleString() + " tokens" : "unknown"}`,
    ) +
      dim(
        `  ·  capabilities: [${capabilities.length ? capabilities.join(", ") : "none returned"}]`,
      ),
  );

  // Capability check
  // If the model can't serve the task, exit immediately — no bid is created.
  spinner.start(dim("Checking model capabilities against task requirements…"));
  const capCheck = checkCapabilities(
    job.plan.task.type,
    job.plan.task.input,
    capabilities,
  );

  if (!capCheck.ok) {
    spinner.fail(bad("Capability mismatch — bid will not be placed"));
    renderCapabilityError(model, job, capCheck);
    return null; // no bid — capability mismatch
  }

  spinner.succeed(
    good(`Capabilities satisfied: [${capCheck.required.join(", ")}]`),
  );

  // Build prompt & estimate input tokens
  const prompt = buildPromptFromJob(job.plan.task, job.plan);
  const inputTokens = estimateInputTokensFromJob(job.plan.task, job.plan);
  const taskType = classifyTask(prompt);

  console.log("deadline:", job.deadline, "now:", Date.now());
  console.log("max_token_amount:", job.maxTokenAmount);
  console.log("job: ", job);

  // Cap output estimate at job's max_token_amount
  const rawOutputEst = estimateOutputTokens(inputTokens, taskType);
  const estimatedOutput = Math.min(rawOutputEst, job.maxTokenAmount ?? 2048);
  const contextFit = analyzeContextFit(
    inputTokens,
    estimatedOutput,
    contextWindow,
  );

  // Warm-up probe
  spinner.start(dim("Running warm-up probe (1 token)…"));
  const probe = await runWarmupProbe(model);

  if (probe.ok) {
    spinner.succeed(
      dim(`Generation speed: ${probe.tokensPerSec ?? "?"} tok/s`),
    );
  } else {
    spinner.warn(
      warn("Warm-up probe failed — time estimates will be unavailable"),
    );
  }

  // Deadline feasibility check
  if (probe.ok) {
    const timeEst = estimateTime(inputTokens, estimatedOutput, probe);
    if (timeEst.estimatedMs != null && timeEst.estimatedMs > remainingMs) {
      console.log();
      console.log(bad("  ✘  DEADLINE NOT MET — bid will not be placed"));
      console.log(
        `${dim("  Estimated time  ")}  ${chalk.white(formatDuration(timeEst.estimatedMs))}`,
      );
      console.log(
        `${dim("  Time remaining  ")}  ${chalk.white(formatDuration(remainingMs))}`,
      );
      console.log(dim("\n  No bid.json has been written.\n"));
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
      accuracyEst = adjustAccuracyScore(
        accuracyProbe.score,
        taskType,
        contextFit,
      );
    } else {
      spinner.warn(
        warn("Accuracy probe returned no usable score — using heuristics"),
      );
    }
  }

  // Compile estimates
  const timeEst = estimateTime(inputTokens, estimatedOutput, probe);
  const tokenEst = {
    input: inputTokens,
    output: estimatedOutput,
    total: inputTokens + estimatedOutput,
    contextPercent: contextFit.percent,
  };

  const reportInput = {
    modelName: model,
    modelInfo,
    probe,
    inputTokens,
    taskType,
    contextFit,
    timeEst,
    tokenEst,
    accuracyEst,
  };

  // Render terminal report
  renderReport(reportInput);

  // Build & write bid.json and bid.diagnostics.json
  spinner.start(dim("Writing bid files…"));
  const jobId = getJobId(job);
  const bid = buildBid(reportInput, jobId);
  const diagnostics = buildDiagnostics(reportInput, jobId, probe);
  const { bidPath, diagnosticsPath } = await writeBid(
    bid,
    diagnostics,
    process.cwd(),
  );
  spinner.succeed(good("Bid files written"));

  renderBidSummary(bid, diagnostics, bidPath, diagnosticsPath);

  // Optionally execute
  if (diagnostics.verdict === "reject" && !opts.yes) {
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: "confirm",
        name: "proceed",
        message: chalk.hex("#f87171")("Bid verdict is REJECT. Run anyway?"),
        default: false,
      },
    ]);
    if (!proceed) {
      console.log(dim("\n  Request cancelled.\n"));
      return bid;
    }
  }

  if (opts.yes) {
    await executeRequest(model, prompt, job.maxTokenAmount);
    return bid;
  }

  if (!opts.estimateOnly) {
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: "confirm",
        name: "proceed",
        message: chalk.white("Run the actual request now?"),
        default: false,
      },
    ]);

    if (proceed) await executeRequest(model, prompt, job.maxTokenAmount);
    else console.log(dim("\n  Request cancelled. No tokens were burned.\n"));
  }

  return bid;
}

// Execute real request
async function executeRequest(
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<void> {
  console.log();
  const spinner = ora({
    text: chalk.white("Running your request…"),
    color: "cyan",
  }).start();

  try {
    const result = await generate(model, prompt, { num_predict: maxTokens });
    const elapsedMs = (result.total_duration ?? 0) / 1_000_000;
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
        dim(`  │  ${elapsedSec}s total`),
    );
    console.log();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(bad("Request failed: " + message));
    process.exit(1);
  }
}
