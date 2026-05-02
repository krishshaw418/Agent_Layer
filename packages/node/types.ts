// Ollama API types
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;      // nanoseconds
  load_duration?: number;       // nanoseconds
  prompt_eval_count?: number;
  prompt_eval_duration?: number; // nanoseconds
  eval_count?: number;
  eval_duration?: number;       // nanoseconds
}

export interface OllamaModelInfo {
  // Allow any model-architecture-specific keys (e.g. llama.context_length, gemma3.block_count)
  [key: string]: unknown;

  // Well-known keys we actually use — typed explicitly for safe access
  "general.architecture"?: string;
  "general.parameter_count"?: number;
  "general.file_type"?: number;
  "general.quantization_version"?: number;
  "tokenizer.ggml.model"?: string;
  "tokenizer.ggml.bos_token_id"?: number;
  "tokenizer.ggml.eos_token_id"?: number;
}

export interface OllamaShowResponse {
  parameters?: string;           // e.g. "temperature 0.7\nnum_ctx 2048"
  template?: string;
  license?: string;
  capabilities?: string[];       // e.g. ["completion", "vision"]
  modified_at?: string;          // ISO timestamp
  details?: {
    parent_model?: string;
    format: string;              // e.g. "gguf"
    family: string;              // e.g. "llama", "gemma3"
    families: string[];
    parameter_size: string;      // e.g. "4.3B"
    quantization_level: string;  // e.g. "Q4_K_M"
  };
  model_info?: OllamaModelInfo;
}

// Daemon & model check
export type DaemonCheckResult =
  | { ok: true; models: OllamaModel[] }
  | { ok: false; error: string };

export type ModelCheckResult =
  | { running: true; model: OllamaModel; allModels: string[] }
  | { running: false; error?: string; allModels?: string[] };

// Task classification
export type TaskType =
  | "code_generation"
  | "summarization"
  | "translation"
  | "question_answer"
  | "creative_writing"
  | "analysis"
  | "extraction"
  | "general";

export interface TaskClassification {
  type: TaskType;
  label: string;
  outputMultiplier: number;
  baseTokens: number;
}

// Context fit
export type ContextGrade = "excellent" | "good" | "tight" | "overflow" | "unknown";

export interface ContextFitResult {
  grade: ContextGrade;
  percent: number | null;
  total?: number;
  contextWindow?: number;
}

// Probe results
export type WarmupProbeResult =
  | {
      ok: true;
      tokensPerSec: number | null;
      promptTokPerSec: number | null;
      promptEvalMs: number | null;
      evalMs: number | null;
      totalMs: number;
      rawResult: OllamaGenerateResponse;
    }
  | { ok: false; error: string };

export type AccuracyProbeResult =
  | { ok: true; score: number | null; percent: number | null; confidence: ConfidenceLevel; raw: string }
  | { ok: false; error: string };

export type ConfidenceLevel = "high" | "medium" | "low" | "unknown";

// Estimates
export interface TimeEstimate {
  estimatedMs: number | null;
  promptMs?: number;
  evalMs?: number;
  confidence: ConfidenceLevel;
}

export interface TokenEstimate {
  input: number;
  output: number;
  total: number;
  contextPercent: number | null;
}

export interface AccuracyEstimate {
  score: number | null;
  percent: number | null;
  confidence: ConfidenceLevel;
}

// Report input
export interface ReportInput {
  modelName: string;
  modelInfo: OllamaShowResponse | null;
  probe: WarmupProbeResult;
  inputTokens: number;
  taskType: TaskClassification;
  contextFit: ContextFitResult;
  timeEst: TimeEstimate;
  tokenEst: TokenEstimate;
  accuracyEst: AccuracyEstimate;
}

// CLI options
export interface PreflightOptions {
  estimateOnly: boolean;
  yes: boolean;
  skipAccuracy: boolean;
}

// On-chain Bid schema
// Fields node_id, reputation, and signature will be handled outside this tool
export interface Bid {
  job_id: string;                 // from the job event on-chain
  placed_at: number;              // unix timestamp (seconds)
  token: number;                  // total estimated tokens to complete the task
  time_requires: number;          // estimated time in milliseconds
  confidence: number;             // 0.0–1.0 float
  model: string;                  // ollama model name
}

// For local diagnostic
export interface BidDiagnostics {
  job_id: string;
  generated_at: string;
  task_type: TaskType;
  task_label: string;
  tokens: {
    input: number;
    output_estimated: number;
    total_estimated: number;
    context_window: number | null;
    context_used_percent: number | null;
  };
  time: {
    estimated_ms: number | null;
    prompt_processing_ms: number | null;
    token_generation_ms: number | null;
    time_confidence: ConfidenceLevel;
  };
  accuracy: {
    score: number | null;
    confidence: ConfidenceLevel;
    context_fit: ContextGrade;
  };
  hardware: {
    generation_tokens_per_sec: number | null;
    prompt_tokens_per_sec: number | null;
  };
  verdict: "accept" | "caution" | "reject";
  verdict_reasons: string[];
}

// Job schema
export type InputType = "file_url" | "text" | "image_url";

export interface JobInput {
  type: InputType;
  data: string;          // URL for file_url/image_url, raw text for text inputs
}

export type JobTaskType =
  | "code_generation"
  | "summarization"
  | "translation"
  | "question_answer"
  | "creative_writing"
  | "analysis"
  | "extraction";

export interface JobTask {
  task_id: string;                        // e.g. "summarization-1777405781274-b909c47e"
  type: JobTaskType;
  input: JobInput;
  expected_output: "text" | "json" | "image";
  dependencies: string[];                 // task_ids this task depends on
}

export interface JobContext {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface JobPlan {
  task: JobTask;
  context: JobContext[];                  // prior conversation turns
  metadata: {
    system_prompts: string[];
    [key: string]: unknown;
  };
}

export interface Job {
  _id?: string;                  // DB-assigned — present after indexer saves to DB
  created_at: number;            // unix milliseconds
  plan: JobPlan;
  max_token_amount: number;      // max output tokens allowed
  deadline: number;              // unix milliseconds — absolute expiry
  createdBy: string;             // user identifier
}

// Convenience accessors
export function getJobId(job: Job): string {
  // Prefer DB-assigned _id when fetched via API, fall back to task_id
  // from raw chain schema (e.g. when loading from job.json directly)
  return job._id ?? job.plan.task.task_id;
}

export function isJobExpired(job: Job): boolean {
  return Date.now() >= job.deadline;
}

export function jobTimeRemainingMs(job: Job): number {
  return Math.max(0, job.deadline - Date.now());
}

// Capability check
export type OllamaCapability = "completion" | "vision" | "image_generation" | "tools" | string;

export interface CapabilityCheckResult {
  ok: boolean;
  required: OllamaCapability[];
  available: OllamaCapability[];
  missing: OllamaCapability[];
  reason?: string;
}