import { generate } from "../utils/ollama.js";
import type {
  AccuracyEstimate,
  AccuracyProbeResult,
  ConfidenceLevel,
  ContextFitResult,
  TaskClassification,
} from "../types.js";

// Heuristic baseline scores per task type
// Used as a floor when the probe returns an implausibly low score, and as
// the sole signal when --skip-accuracy is set.

const TASK_BASELINES: Record<string, number> = {
  question_answer:  8,
  summarization:    8,
  translation:      7,
  extraction:       7,
  general:          7,
  creative_writing: 6,
  analysis:         6,
  code_generation:  6,
};

// A probe result is "implausible" if the model scored itself below this —
const IMPLAUSIBILITY_THRESHOLD = 3;

// Meta-prompt
function buildMetaPrompt(userPrompt: string): string {
  const excerpt = userPrompt.slice(0, 400);
  return `Rate your ability to answer this request from 1 (cannot do it) to 10 (can do it perfectly). Request: ${excerpt} Reply with one number only.`;
}

// Tagging the scores
function scoreToConfidence(score: number): ConfidenceLevel {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

function parseScore(raw: string): number | null {
  const match = raw.trim().match(/\d+/);
  if (!match?.[0]) return null;
  const score = parseInt(match[0], 10);
  return score >= 1 && score <= 10 ? score : null;
}

function baselineFor(taskType: TaskClassification): number {
  return TASK_BASELINES[taskType.type] ?? 7;
}

// Probe to calculate estimates
export async function runAccuracyProbe(
  modelName: string,
  userPrompt: string
): Promise<AccuracyProbeResult> {
  try {
    const result = await generate(modelName, buildMetaPrompt(userPrompt), {
      num_predict: 5,
      temperature: 0,
    });

    const raw   = result.response ?? "";
    const score = parseScore(raw);

    return {
      ok:         true,
      score,
      percent:    score != null ? score * 10 : null,
      confidence: score != null ? scoreToConfidence(score) : "unknown",
      raw,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// Score adjustment
export function adjustAccuracyScore(
  probeScore: number | null,
  taskType: TaskClassification,
  contextFit: ContextFitResult
): AccuracyEstimate {
  const baseline = baselineFor(taskType);

  let score: number;

  if (probeScore == null) {
    // No probe ran (--skip-accuracy) — use heuristic baseline
    score = baseline;
  } else if (probeScore < IMPLAUSIBILITY_THRESHOLD) {
    // Probe returned an implausibly low score (small model misread the prompt)
    // Blend: 80% baseline, 20% probe — discount but don't fully ignore it
    score = baseline * 0.8 + probeScore * 0.2;
  } else {
    // Probe looks plausible — blend: 60% probe, 40% baseline
    score = probeScore * 0.6 + baseline * 0.4;
  }

  // Structural penalties
  if (contextFit.grade === "overflow") score -= 3;
  else if (contextFit.grade === "tight") score -= 1;

  // Clamp to [1, 10]
  score = Math.max(1, Math.min(10, score));
  const rounded = Math.round(score * 10) / 10;

  return {
    score:      rounded,
    percent:    Math.round(rounded * 10),
    confidence: scoreToConfidence(Math.round(rounded)),
  };
}