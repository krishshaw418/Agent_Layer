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

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Job file must be a JSON object" };
  }

  const obj = parsed as Record<string, unknown>;

  if (typeof obj["job_id"] !== "string" || !obj["job_id"]) {
    return { ok: false, error: 'Job file missing required field: "job_id" (string)' };
  }

  if (typeof obj["task"] !== "object" || obj["task"] === null) {
    return { ok: false, error: 'Job file missing required field: "task" (object)' };
  }

  const task = obj["task"] as Record<string, unknown>;

  // Validating task type
  if (typeof task["type"] !== "string") {
    return { ok: false, error: '"task.type" must be a string' };
  }

  if (!VALID_TASK_TYPES.has(task["type"] as JobTaskType)) {
    return {
      ok: false,
      error: `Unknown task type: "${task["type"]}". Valid types: ${[...VALID_TASK_TYPES].join(", ")}`,
    };
  }

  // Validating task.input
  if (typeof task["input"] !== "object" || task["input"] === null) {
    return { ok: false, error: '"task.input" must be an object' };
  }

  const input = task["input"] as Record<string, unknown>;

  // Validating task.type
  if (typeof input["type"] !== "string") {
    return { ok: false, error: '"task.input.type" must be a string' };
  }

  if (input["type"] === "file_url" && typeof input["url"] !== "string") {
    return { ok: false, error: '"task.input.url" is required when input type is "file_url"' };
  }

  if (input["type"] === "text" && typeof input["text"] !== "string") {
    return { ok: false, error: '"task.input.text" is required when input type is "text"' };
  }

  return {
    ok: true,
    job: obj as unknown as Job,
  };
}

// Prompt builder
// Converts the job task into a prompt string for token estimation purposes.
// For file_url inputs we can't read the actual file, so we approximate
// using the file size in bytes as a token proxy.

export function buildPromptFromJob(task: JobTask): string {
  const { type, input } = task;

  if (input.type === "text" && input.text) {
    return input.text;
  }

  if (input.type === "file_url" && input.url) {
    // We don't download the file — instead build a representative prompt
    // that captures the task intent for classification purposes.
    const mimeHint = input.mime ? ` (${input.mime})` : "";
    const sizeHint = input.size_bytes
      ? ` [~${Math.round(input.size_bytes / 4)} estimated tokens]`
      : "";
    return `${type} the following document${mimeHint}${sizeHint}: ${input.url}`;
  }

  if (input.type === "image_url" && input.url) {
    return `${type} the following image: ${input.url}`;
  }

  return type;
}

// Input token estimator for file inputs
// When the input is a file, we can't tokenize it locally.
// We approximate from size_bytes: 1 token ≈ 4 bytes for text,
// 1 token ≈ 1000 bytes for images/PDFs (much less dense).

export function estimateInputTokensFromJob(task: JobTask): number {
  const { input } = task;

  if (input.type === "text" && input.text) {
    // Direct text — tokenize normally
    return Math.ceil(input.text.length / 4);
  }

  if (input.size_bytes) {
    const mime = input.mime ?? "";

    if (mime.startsWith("image/")) {
      // Images are processed as patches — roughly 256–1024 tokens per image
      return 512;
    }

    if (mime === "application/pdf") {
      // PDF: ~250 tokens per page, ~3000 bytes per page
      const estimatedPages = Math.max(1, Math.round(input.size_bytes / 3000));
      return estimatedPages * 250;
    }

    if (mime === "application/json" || mime === "text/plain") {
      return Math.ceil(input.size_bytes / 4);
    }

    // Generic fallback
    return Math.ceil(input.size_bytes / 4);
  }

  // If no size info — using a conservative default
  return 500;
}