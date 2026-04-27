import type {
  ContextFitResult,
  ContextGrade,
  OllamaShowResponse,
  TaskClassification,
  TaskType,
} from "../types.js";

const CHARS_PER_TOKEN = 4;

// Token counting

export function estimateTokens(text: string): number {
  const charCount = text.replace(/\s+/g, " ").trim().length;
  return Math.ceil(charCount / CHARS_PER_TOKEN);
}

// Task classification

interface TaskRule {
  type: TaskType;
  label: string;
  keywords: string[];
  outputMultiplier: number;
  baseTokens: number;
}

const TASK_RULES: TaskRule[] = [
  {
    type: "code_generation",
    label: "Code Generation",
    keywords: ["write", "code", "function", "implement", "script", "class", "program"],
    outputMultiplier: 3.5,
    baseTokens: 400,
  },
  {
    type: "summarization",
    label: "Summarization",
    keywords: ["summarize", "summary", "tldr", "brief", "condense", "shorten"],
    outputMultiplier: 0.3,
    baseTokens: 150,
  },
  {
    type: "translation",
    label: "Translation",
    keywords: ["translate", "translation", "in french", "in spanish", "in german", "in hindi"],
    outputMultiplier: 1.1,
    baseTokens: 80,
  },
  {
    type: "question_answer",
    label: "Question & Answer",
    keywords: ["what is", "how does", "explain", "why", "when", "who", "where", "?"],
    outputMultiplier: 1.8,
    baseTokens: 200,
  },
  {
    type: "creative_writing",
    label: "Creative Writing",
    keywords: ["write a story", "poem", "essay", "blog", "creative", "narrative", "fiction"],
    outputMultiplier: 5,
    baseTokens: 600,
  },
  {
    type: "analysis",
    label: "Analysis / Reasoning",
    keywords: ["analyze", "analysis", "compare", "evaluate", "pros and cons", "review", "assess"],
    outputMultiplier: 2.5,
    baseTokens: 350,
  },
  {
    type: "extraction",
    label: "Data Extraction",
    keywords: ["extract", "list", "enumerate", "find all", "pull out", "identify"],
    outputMultiplier: 1.2,
    baseTokens: 120,
  },
];

const FALLBACK_TASK: TaskClassification = {
  type: "general",
  label: "General",
  outputMultiplier: 2,
  baseTokens: 250,
};

export function classifyTask(prompt: string): TaskClassification {
  const lower = prompt.toLowerCase();

  let best: TaskRule | null = null;
  let bestScore = 0;

  for (const rule of TASK_RULES) {
    const score = rule.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }

  return best ?? FALLBACK_TASK;
}

// Output token estimation

export function estimateOutputTokens(
  inputTokens: number,
  task: TaskClassification
): number {
  const base = task.baseTokens;
  const scaled = Math.ceil(inputTokens * task.outputMultiplier);
  return Math.ceil(base * 0.4 + scaled * 0.6);
}

// Context window fit

export function analyzeContextFit(
  inputTokens: number,
  estimatedOutputTokens: number,
  contextWindow: number | null
): ContextFitResult {
  if (!contextWindow) return { grade: "unknown", percent: null };

  const total = inputTokens + estimatedOutputTokens;
  const percent = Math.round((total / contextWindow) * 100);

  let grade: ContextGrade;
  if (percent < 50) grade = "excellent";
  else if (percent < 75) grade = "good";
  else if (percent < 90) grade = "tight";
  else grade = "overflow";

  return { grade, percent, total, contextWindow };
}

// Context window parsing

export function parseContextWindow(modelInfo: OllamaShowResponse | null): number | null {
  if (!modelInfo) return null;

  // Read directly from model_info using architecture family as key prefix
  const info = modelInfo.model_info;
  if (info) {
    const arch = modelInfo.details?.family ?? "general";
    const contextKey = `${arch}.context_length`;
    const fromInfo = info[contextKey];
    if (typeof fromInfo === "number" && fromInfo > 0) return fromInfo;

    // Fallback: scan all keys for any *.context_length field
    const contextEntry = Object.entries(info).find(
      ([k, v]) => k.endsWith(".context_length") && typeof v === "number"
    );
    if (contextEntry) return contextEntry[1] as number;
  }

  // Check parameters string for a user-set num_ctx override
  const params = modelInfo.parameters ?? "";
  const match = params.match(/num_ctx\s+(\d+)/);
  if (match?.[1]) return parseInt(match[1], 10);

  // Family heuristic — known typical defaults
  const family = (modelInfo.details?.family ?? "").toLowerCase();
  if (family.includes("llama"))   return 8192;
  if (family.includes("mistral")) return 8192;
  if (family.includes("gemma"))   return 8192;
  if (family.includes("qwen"))    return 32768;
  if (family.includes("phi"))     return 4096;

  return 4096; // conservative fallback
}