#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import { preflightCommand } from "../src/commands/preflight.js";
import { getModelInfo } from "../utils/ollama.js";
import { parseContextWindow } from "../utils/tokens.js";
import type { PreflightOptions } from "../types.js";

program
  .name("preflight")
  .description(
    chalk.hex("#a78bfa")("⚡ Pre-flight estimator for Ollama model requests\n") +
    chalk.gray("  Estimates time, token burn, and accuracy before sending your prompt.")
  )
  .version("1.0.0");

program
  .command("run <model> <prompt>")
  .description("Analyse a prompt against a model and generate a bid")
  .option("-e, --estimate-only",  "Show estimates but do not offer to run the request", false)
  .option("-y, --yes",            "Auto-confirm and run the real request after estimates", false)
  .option("--skip-accuracy",      "Skip the accuracy meta-probe (faster, saves ~5 tokens)", false)
  .option("--job-id <id>",        "Job ID from the smart contract event", "job_local")
  .addHelpText("after", `
${chalk.gray("Examples:")}
  ${chalk.white('$ preflight run qwen2:0.5b "Summarize this document" --job-id job_12345')}
  ${chalk.white('$ preflight run qwen2:0.5b "Write a REST API" --estimate-only')}
  ${chalk.white('$ preflight run qwen2:0.5b "What is 2+2?" --yes --skip-accuracy')}

${chalk.gray("Environment:")}
  ${chalk.white("OLLAMA_HOST")}   Ollama base URL ${chalk.gray("(default: http://localhost:11434)")}
`)
  .action(async (model: string, prompt: string, opts: PreflightOptions & { jobId: string }) => {
    await preflightCommand(model, prompt, opts, opts.jobId);
  });

// ── Debug: inspect raw model metadata ────────────────────────────────────────

program
  .command("inspect <model>")
  .description("Print raw model metadata from Ollama (debug)")
  .action(async (model: string) => {
    const info = await getModelInfo(model);

    if (!info) {
      console.error(chalk.red(`\n  Could not fetch model info for "${model}"\n`));
      process.exit(1);
    }

    const dim   = chalk.gray;
    const lbl   = chalk.hex("#7dd3fc");
    const white = chalk.white;
    const good  = chalk.hex("#4ade80");

    console.log();
    console.log(dim("─".repeat(56)));
    console.log(chalk.hex("#a78bfa")("  MODEL INSPECT  ") + dim("│  ") + white(model));
    console.log(dim("─".repeat(56)));

    console.log();
    console.log(lbl("  details"));
    console.log(dim(JSON.stringify(info.details, null, 4).replace(/^/gm, "    ")));

    console.log();
    console.log(lbl("  parameters (raw string)"));
    console.log(dim("    ") + white(info.parameters?.replace(/\n/g, " | ") ?? "(none)"));

    console.log();
    console.log(lbl("  capabilities"));
    console.log(dim("    ") + white(info.capabilities?.join(", ") ?? "(none)"));

    console.log();
    console.log(lbl("  model_info — context-related keys"));
    if (info.model_info) {
      const contextKeys = Object.entries(info.model_info).filter(([k]) =>
        k.includes("context") || k.includes("block_count") || k.includes("embedding")
      );
      for (const [k, v] of contextKeys) {
        console.log(`    ${dim(k.padEnd(48))}${white(String(v))}`);
      }
    } else {
      console.log(dim("    (model_info not returned by Ollama for this model)"));
    }

    console.log();
    console.log(lbl("  parsed context window"));
    const contextWindow = parseContextWindow(info);
    console.log(`    ${good(contextWindow != null ? `${contextWindow.toLocaleString()} tokens` : "unknown")}`);

    console.log();
    console.log(dim("─".repeat(56)));
    console.log();
  });

if (process.argv.length < 3) {
  program.help();
}

program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red("\n  Error: " + message));
  process.exit(1);
});