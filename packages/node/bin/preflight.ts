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
    chalk.gray("  Reads a job JSON file from chain, checks model capabilities, and generates a bid.")
  )
  .version("1.0.0");

program
  .command("run <model>")
  .description("Run preflight checks and generate bid.json for a job")
  .requiredOption("--job <path>",     "Path to the job JSON file pulled from chain")
  .option("-e, --estimate-only",      "Show estimates but do not offer to run the request", false)
  .option("-y, --yes",                "Auto-confirm and run the real request after estimates", false)
  .option("--skip-accuracy",          "Skip the accuracy meta-probe (faster, saves ~5 tokens)", false)
  .addHelpText("after", `
${chalk.gray("Examples:")}
  ${chalk.white("$ preflight run qwen2:0.5b --job ./job.json")}
  ${chalk.white("$ preflight run qwen2:0.5b --job ./job.json --estimate-only")}
  ${chalk.white("$ preflight run qwen2:0.5b --job ./job.json --yes --skip-accuracy")}

${chalk.gray("Job file format (from chain):")}
  ${chalk.gray("{")}
  ${chalk.gray('  "job_id": "job_12345",')}
  ${chalk.gray('  "task": {')}
  ${chalk.gray('    "type": "summarization",')}
  ${chalk.gray('    "input": { "type": "file_url", "url": "...", "mime": "application/pdf", "size_bytes": 204800 },')}
  ${chalk.gray('    "expected_output": "text"')}
  ${chalk.gray("  }")}
  ${chalk.gray("}")}

${chalk.gray("Supported task types:")}
  ${chalk.white("code_generation  summarization  translation  question_answer")}
  ${chalk.white("creative_writing  analysis  extraction")}

${chalk.gray("Environment:")}
  ${chalk.white("OLLAMA_HOST")}   Ollama base URL ${chalk.gray("(default: http://localhost:11434)")}
`)
  .action(async (model: string, opts: PreflightOptions & { job: string }) => {
    await preflightCommand(model, opts.job, opts);
  });

// inspect command

program
  .command("inspect <model>")
  .description("Print raw model metadata from Ollama — useful for debugging capability issues")
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
    console.log(lbl("  capabilities"));
    console.log(dim("    ") + white(info.capabilities?.join(", ") ?? "(none returned)"));

    console.log();
    console.log(lbl("  details"));
    console.log(dim(JSON.stringify(info.details, null, 4).replace(/^/gm, "    ")));

    console.log();
    console.log(lbl("  parameters (raw)"));
    console.log(dim("    ") + white(info.parameters?.replace(/\n/g, " | ") ?? "(none)"));

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