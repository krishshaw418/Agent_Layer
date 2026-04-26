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

export interface OllamaShowResponse {
  modelfile?: string;
  parameters?: string;
  template?: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  model_info?: Record<string, unknown>;
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

// Bid
 
export interface BidToken {
  input: number;
  output_estimated: number;
  total_estimated: number;
  context_window: number | null;
  context_used_percent: number | null;
}
 
export interface BidTime {
  estimated_ms: number | null;
  estimated_human: string;
  prompt_processing_ms: number | null;
  token_generation_ms: number | null;
  confidence: ConfidenceLevel;
}
 
export interface BidAccuracy {
  score: number | null;           // 1–10
  percent: number | null;         // 0–100
  confidence: ConfidenceLevel;
  context_fit: ContextGrade;
}
 
export interface BidHardware {
  generation_tokens_per_sec: number | null;
  prompt_tokens_per_sec: number | null;
}
 
export interface Bid {
  schema_version: "1.0";
  bid_at: string;
  task: {
    prompt_excerpt: string;       // first 120 chars of prompt
    task_type: TaskType;
    task_label: string;
  };
  model: {
    name: string;
    parameter_size: string | null;
    quantization: string | null;
    context_window: number | null;
  };
  hardware: BidHardware;
  time: BidTime;
  tokens: BidToken;
  accuracy: BidAccuracy;
  verdict: "accept" | "caution" | "reject";
  verdict_reasons: string[];
}