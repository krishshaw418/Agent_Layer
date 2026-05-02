import fs from "node:fs/promises";
import path from "node:path";
import type { Job, JobTask, JobTaskType } from "../types.js";

// Valid task types
const VALID_TASK_TYPES = new Set<JobTaskType>([
  "code_generation",
  "summarization",
  "translation",
  "question_answer",
  "creative_writing",
  "analysis",
  "extraction",
]);

// Load & Validate
export type JobLoadResult =
  | { ok: true;  job: Job }
  | { ok: false; error: string };

export async function loadJob(filePath: string): Promise<JobLoadResult> {
  const resolved = path.resolve(filePath);

  let raw: string;
  try {
    raw = await fs.readFile(resolved, "utf-8");
  } catch {
    return { ok: false, error: `Cannot read job file: ${resolved}` };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: `Invalid JSON in job file: ${resolved}` };
  }

  return validateJob(parsed);
}

export function validateJob(parsed: unknown): JobLoadResult {
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Job must be a JSON object" };
  }

  const obj = parsed as Record<string, unknown>;

  // Top-level fields
  if (typeof obj["created_at"] !== "number") {
    return { ok: false, error: '"created_at" must be a number (unix ms)' };
  }

  if (typeof obj["deadline"] !== "number") {
    return { ok: false, error: '"deadline" must be a number (unix ms)' };
  }

  if (typeof obj["max_token_amount"] !== "number") {
    return { ok: false, error: '"max_token_amount" must be a number' };
  }

  // plan
  if (typeof obj["plan"] !== "object" || obj["plan"] === null) {
    return { ok: false, error: '"plan" must be an object' };
  }

  const plan = obj["plan"] as Record<string, unknown>;

  // plan.task
  if (typeof plan["task"] !== "object" || plan["task"] === null) {
    return { ok: false, error: '"plan.task" must be an object' };
  }

  const task = plan["task"] as Record<string, unknown>;

  if (typeof task["task_id"] !== "string" || !task["task_id"]) {
    return { ok: false, error: '"plan.task.task_id" must be a non-empty string' };
  }

  if (typeof task["type"] !== "string") {
    return { ok: false, error: '"plan.task.type" must be a string' };
  }

  if (!VALID_TASK_TYPES.has(task["type"] as JobTaskType)) {
    return {
      ok: false,
      error: `Unknown task type: "${task["type"]}". Valid: ${[...VALID_TASK_TYPES].join(", ")}`,
    };
  }

  // plan.task.input
  if (typeof task["input"] !== "object" || task["input"] === null) {
    return { ok: false, error: '"plan.task.input" must be an object' };
  }

  const input = task["input"] as Record<string, unknown>;

  if (typeof input["type"] !== "string") {
    return { ok: false, error: '"plan.task.input.type" must be a string' };
  }

  if (typeof input["data"] !== "string" || !input["data"]) {
    return { ok: false, error: '"plan.task.input.data" must be a non-empty string (URL or text)' };
  }

  // plan.context
  if (!Array.isArray(plan["context"])) {
    return { ok: false, error: '"plan.context" must be an array' };
  }

  // plan.metadata
  if (typeof plan["metadata"] !== "object" || plan["metadata"] === null) {
    return { ok: false, error: '"plan.metadata" must be an object' };
  }

  return { ok: true, job: obj as unknown as Job };
}

// Prompt builder
// Builds the full prompt string for the model including:
// system prompts from metadata
// prior conversation context
// the actual task instruction

export function buildPromptFromJob(task: JobTask, plan: Job["plan"]): string {
  const parts: string[] = [];

  // System prompts
  if (plan.metadata.system_prompts.length > 0) {
    parts.push(plan.metadata.system_prompts.join("\n"));
  }

  // Prior conversation context
  if (plan.context.length > 0) {
    const contextBlock = plan.context
      .map((c) => `${c.role === "user" ? "User" : "Assistant"}: ${c.content}`)
      .join("\n");
    parts.push(contextBlock);
  }

  // Task instruction — built from task type + input
  const taskInstruction = buildTaskInstruction(task);
  parts.push(taskInstruction);

  return parts.join("\n\n");
}

function buildTaskInstruction(task: JobTask): string {
  const { type, input } = task;

  if (input.type === "text") {
    // data is the raw text content
    return `${type.replace("_", " ")}: ${input.data}`;
  }

  if (input.type === "file_url" || input.type === "image_url") {
    // data is a URL — infer mime from extension for context
    const ext = input.data.split(".").pop()?.toLowerCase() ?? "";
    const mimeHint = EXT_TO_MIME[ext] ?? ext;
    return `${type.replace("_", " ")} the following ${mimeHint} document: ${input.data}`;
  }

  return `${type}: ${input.data}`;
}

// Extension → mime hint map
const EXT_TO_MIME: Record<string, string> = {
  pdf:  "PDF",
  json: "JSON",
  txt:  "text",
  png:  "image",
  jpg:  "image",
  jpeg: "image",
  webp: "image",
  gif:  "image",
  md:   "markdown",
  csv:  "CSV",
};

// Infer mime from URL
export type InferredMime =
  | "application/pdf"
  | "application/json"
  | "text/plain"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/gif"
  | "unknown";

export function inferMimeFromUrl(url: string): InferredMime {
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, InferredMime> = {
    pdf:  "application/pdf",
    json: "application/json",
    txt:  "text/plain",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif:  "image/gif",
  };
  return map[ext] ?? "unknown";
}

// Input token estimator
// Estimates input token count from the job.
// For file_url we approximate from URL + context since we don't download.
// For text inputs we count directly.

export function estimateInputTokensFromJob(task: JobTask, plan: Job["plan"]): number {
  let total = 0;

  // System prompts
  for (const sp of plan.metadata.system_prompts) {
    total += Math.ceil(sp.length / 4);
  }

  // Context turns
  for (const ctx of plan.context) {
    total += Math.ceil(ctx.content.length / 4);
  }

  // Task input
  if (task.input.type === "text") {
    total += Math.ceil(task.input.data.length / 4);
  } else {
    // file_url / image_url — approximate by inferred mime
    const mime = inferMimeFromUrl(task.input.data);

    if (mime.startsWith("image/")) {
      total += 512;                                      // ~256–1024 tokens per image
    } else if (mime === "application/pdf") {
      // Can't know page count without downloading — use conservative estimate
      total += 1500;                                     // ~6 pages average
    } else if (mime === "application/json" || mime === "text/plain") {
      total += 500;                                      // conservative fallback
    } else {
      total += 500;
    }
  }

  return total;
}