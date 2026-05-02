import { inferMimeFromUrl } from "./job.js";
import type {
  CapabilityCheckResult,
  JobInput,
  JobTaskType,
  OllamaCapability,
} from "../types.js";

// MIME types that require vision capability
const VISION_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",    // Ollama processes PDFs through vision pipeline
]);

// Required Base capability per task type
const TASK_BASE_REQUIREMENTS: Record<JobTaskType, OllamaCapability[]> = {
  code_generation:  ["completion"],
  summarization:    ["completion"],
  translation:      ["completion"],
  question_answer:  ["completion"],
  creative_writing: ["completion"],
  analysis:         ["completion"],
  extraction:       ["completion"],
};

// Derive required capabilities from tasktype + input
export function deriveRequiredCapabilities(
  taskType: JobTaskType,
  input: JobInput
): OllamaCapability[] {
  const required = [...(TASK_BASE_REQUIREMENTS[taskType] ?? ["completion"])];

  // Infer mime from the input data field (URL or raw text)
  if (input.type === "file_url" || input.type === "image_url") {
    const mime = inferMimeFromUrl(input.data);
    if (VISION_MIMES.has(mime)) {
      if (!required.includes("vision")) required.push("vision");
    }
  }

  return required;
}

// Main capability check
export function checkCapabilities(
  taskType: JobTaskType,
  input: JobInput,
  modelCapabilities: OllamaCapability[]
): CapabilityCheckResult {
  const required = deriveRequiredCapabilities(taskType, input);
  const missing  = required.filter((cap) => !modelCapabilities.includes(cap));

  if (missing.length === 0) {
    return { ok: true, required, available: modelCapabilities, missing };
  }

  return {
    ok:       false,
    required,
    available: modelCapabilities,
    missing,
    reason:   buildReason(taskType, input, missing),
  };
}

// Reason builder

function buildReason(
  taskType: JobTaskType,
  input: JobInput,
  missing: OllamaCapability[]
): string {
  const parts: string[] = [];

  if (missing.includes("vision")) {
    const mime = input.type !== "text" ? inferMimeFromUrl(input.data) : "unknown";

    if (mime === "application/pdf") {
      parts.push(`Task "${taskType}" with PDF input requires vision capability`);
    } else if (mime.startsWith("image/")) {
      parts.push(`Task "${taskType}" with image input (${mime}) requires vision capability`);
    } else {
      parts.push(`Task "${taskType}" requires vision capability`);
    }
  }

  if (missing.includes("completion")) {
    parts.push(`Task "${taskType}" requires completion capability`);
  }

  for (const cap of missing.filter((c) => c !== "vision" && c !== "completion")) {
    parts.push(`Task "${taskType}" requires "${cap}" capability`);
  }

  return parts.join(". ");
}