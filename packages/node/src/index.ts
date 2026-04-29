export { preflightCommand } from "./commands/preflight.js";

// Types the worker needs
export type {
  Job,
  JobTask,
  JobInput,
  JobTaskType,
  InputType,
  InputMime,

  Bid,
  BidDiagnostics,

  PreflightOptions,

  CapabilityCheckResult,
} from "../types.js";

// Utility exports — useful for workers that do their own validation
export { loadJob }            from "../utils/job.js";
export { checkCapabilities }  from "../utils/capability.js";
export { checkModel }         from "../utils/ollama.js";
export { OLLAMA_HOST }        from "../utils/ollama.js";