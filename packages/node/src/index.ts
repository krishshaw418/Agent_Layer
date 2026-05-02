export { preflightCommand } from "./commands/preflight.js";

// Types the worker needs
export type {
  Job,
  JobPlan,
  JobTask,
  JobInput,
  JobTaskType,
  JobContext,
  InputType,
  Bid,
  BidDiagnostics,
  PreflightOptions,
  CapabilityCheckResult,
} from "../types.js";

// Utility exports — useful for workers that do their own validation
export { getJobId, isJobExpired, jobTimeRemainingMs } from "../types.js";
export { loadJob, validateJob, buildPromptFromJob, estimateInputTokensFromJob, inferMimeFromUrl } from "../utils/job.js";
export { checkCapabilities } from "../utils/capability.js";
export { checkModel, OLLAMA_HOST } from "../utils/ollama.js";