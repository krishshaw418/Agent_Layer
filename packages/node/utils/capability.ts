import type {
  CapabilityCheckResult,
  InputMime,
  JobInput,
  JobTaskType,
  OllamaCapability,
} from "../types.js";

// MIME types that require vision capability
const VISION_MIMES = new Set<InputMime>([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const PDF_MIMES = new Set<InputMime>([
  "application/pdf",
]);

// Required capabilities per task type
// Base requirements without considering input type.
const TASK_BASE_REQUIREMENTS: Record<JobTaskType, OllamaCapability[]> = {
  code_generation:  ["completion"],
  summarization:    ["completion"],
  translation:      ["completion"],
  question_answer:  ["completion"],
  creative_writing: ["completion"],
  analysis:         ["completion"],
  extraction:       ["completion"],
};

// Derive required capabilities from task + input
export function deriveRequiredCapabilities(
  taskType: JobTaskType,
  input: JobInput
): OllamaCapability[] {
  const base = [...(TASK_BASE_REQUIREMENTS[taskType] ?? ["completion"])];

  if (!input.mime) return base;

  // Image input → vision required
  if (VISION_MIMES.has(input.mime as InputMime)) {
    if (!base.includes("vision")) base.push("vision");
  }

  // PDF input → vision required
  if (PDF_MIMES.has(input.mime as InputMime)) {
    if (!base.includes("vision")) base.push("vision");
  }

  return base;
}

// Main capability check
export function checkCapabilities(
  taskType: JobTaskType,
  input: JobInput,
  modelCapabilities: OllamaCapability[]
): CapabilityCheckResult {
  const required  = deriveRequiredCapabilities(taskType, input);
  const available = modelCapabilities;
  const missing   = required.filter((cap) => !available.includes(cap));

  if (missing.length === 0) {
    return { ok: true, required, available, missing };
  }

  const reason = buildReason(taskType, input, missing);

  return { ok: false, required, available, missing, reason };
}

// Reason builder

function buildReason(
  taskType: JobTaskType,
  input: JobInput,
  missing: OllamaCapability[]
): string {
  const parts: string[] = [];

  if (missing.includes("vision")) {
    if (input.mime && PDF_MIMES.has(input.mime as InputMime)) {
      parts.push(`Task "${taskType}" with PDF input requires vision capability (model processes PDF pages as images)`);
    } else if (input.mime && VISION_MIMES.has(input.mime as InputMime)) {
      parts.push(`Task "${taskType}" with image input (${input.mime}) requires vision capability`);
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