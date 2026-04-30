import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

type Role = "system" | "user" | "assistant";

interface ChatMessage {
  role: Role;
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  strategy?: "latency" | "cost" | "balanced";
  metadata?: Record<string, any>;
}

type JsonRecord = Record<string, Prisma.InputJsonValue>;

const client = new OpenAI({
  apiKey: process.env.NIM_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1"
});

const REP_REWARD = 2;
const REP_PENALTY = 5;
const MAX_REPUTATION = 100;
const INITIAL_REPUTATION = 10;

function extractUserIntent(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find(m => m.role === "user");
  if (!lastUser) throw new Error("No user message found");
  return lastUser.content;
}

function safeParseJSON(raw: string, retries = 2): any {
  let cleaned = raw;

  for (let i = 0; i <= retries; i++) {
    try {
      return JSON.parse(cleaned);
    } catch {
      cleaned = cleaned
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }
  }

  throw new Error("Failed to parse LLM JSON");
}

function validatePlan(plan: any) {
  if (!plan.task || typeof plan.task !== "object") {
    throw new Error("Missing task object");
  }

  const task = plan.task;

  const allowedTypes = ["summarization", "translation", "classification", "extract_text"];
  if (!allowedTypes.includes(task.type)) {
    throw new Error(`Invalid task type: ${task.type}`);
  }

  if (!task.input || !task.input.type) {
    throw new Error("Invalid input");
  }

  if (!Array.isArray(task.dependencies)) {
    task.dependencies = [];
  }

  // Ensure constraints exist with valid defaults
  if (!plan.constraints) {
    plan.constraints = {
      priority: "balanced",
      quality: "medium"
    };
  } else {
    // Validate and fix constraint values
    const validPriorities = ["low_cost", "low_latency", "balanced"];
    const validQualities = ["low", "medium", "high"];

    if (!validPriorities.includes(plan.constraints.priority)) {
      plan.constraints.priority = "balanced";
    }

    if (!validQualities.includes(plan.constraints.quality)) {
      plan.constraints.quality = "medium";
    }
  }

  return plan;
}

function generateTaskId(taskType: string): string {
  const normalizedType = taskType.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "task";
  return `${normalizedType}-${Date.now()}-${randomUUID().slice(0, 8)}`;
}

function mapConstraints(llmConstraints: any, strategy?: string) {
  const now = Date.now();
  let config = {};

  let windowMs = 60_000; // default 60s
  if (llmConstraints.priority === "low_cost") {
    windowMs = 300_000; // allow longer bidding for cheaper
  }

  if (llmConstraints.priority === "low_latency") {
    windowMs = 15_000; // short bidding window for low-latency preference
  }

  // Strategy overrides
  if (strategy === "latency") {
    windowMs = Math.min(windowMs, 20_000);
  }

  if (strategy === "cost") {
    windowMs = Math.max(windowMs, 300_000);
  }

  const deadline = now + windowMs;

  const priorityReputation =
    llmConstraints.priority === "low_latency"
      ? INITIAL_REPUTATION + REP_PENALTY * 4
      : llmConstraints.priority === "balanced"
        ? INITIAL_REPUTATION + REP_REWARD * 3
        : INITIAL_REPUTATION;

  const qualityReputation =
    llmConstraints.quality === "high"
      ? INITIAL_REPUTATION + REP_REWARD * 6
      : llmConstraints.quality === "medium"
        ? INITIAL_REPUTATION + REP_REWARD * 2
        : INITIAL_REPUTATION;

  return {
    ...config,
    min_reputation: Math.min(MAX_REPUTATION, Math.max(priorityReputation, qualityReputation)),
    deadline,
    priority: llmConstraints.priority,
    quality: llmConstraints.quality
  };
}

const AVG_CHARS_PER_TOKEN = 4;
const WORDS_TO_TOKENS = 1.3;
const OUTPUT_BUFFER_PER_TASK = 512;
const TASK_PROMPT_OVERHEAD = 150;
const SAFETY_MULTIPLIER = 1.2;
const FALLBACK_PDF_TOKENS = 75_000;
const FALLBACK_WEBPAGE_TOKENS = 2_000;
const FALLBACK_UNKNOWN_TOKENS = 5_000;

function isUrl(str: string): boolean {
  try {
    const u = new URL(str.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function estimateTextTokens(text: string): number {
  if (!text?.trim()) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * WORDS_TO_TOKENS);
}

function estimateUrlTokens(url: string): number {
  try {
    const { pathname, hostname } = new URL(url);
    const ext = pathname.split(".").pop()?.toLowerCase();

    if (ext === "pdf" || hostname.includes("arxiv.org")) return FALLBACK_PDF_TOKENS;
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "")) return 1_000;
    if (["csv", "tsv"].includes(ext ?? "")) return 10_000;
    if (["json", "xml", "yaml", "yml"].includes(ext ?? "")) return 8_000;
    if (["txt", "md"].includes(ext ?? "")) return 5_000;
    if (["docx", "pptx", "xlsx"].includes(ext ?? "")) return 20_000;
    if (hostname.includes("github.com")) return 10_000;

    return FALLBACK_WEBPAGE_TOKENS;
  } catch {
    return FALLBACK_UNKNOWN_TOKENS;
  }
}

function estimateInputTokens(task: any, taskTokenMap: Map<string, number>): number {
  const data = task.input?.data ?? "";
  const type = task.input?.type;

  // file_url or text that is actually a URL
  if (type === "file_url" || (type === "text" && isUrl(data.trim()))) {
    return estimateUrlTokens(data.trim());
  }

  if (type === "text") {
    return estimateTextTokens(data);
  }

  if (type === "ref") {
    const refTokens = taskTokenMap.get(data) ?? FALLBACK_UNKNOWN_TOKENS;
    const shrinkFactor =
      task.type === "summarization"  ? 0.3  :
      task.type === "translation"    ? 1.1  :
      task.type === "classification" ? 0.05 :
      task.type === "extract_text"   ? 0.8  : 0.5;
    return Math.ceil(refTokens * shrinkFactor);
  }

  return FALLBACK_UNKNOWN_TOKENS;
}

function estimateMaxTokenAmount(
  plan: any,
  messages: ChatMessage[] = []
): number {
  // 1. Message history tokens
  const messageTokens = messages.reduce((sum, m) => {
    return sum + estimateTextTokens(m.content) + 4;
  }, 0);

  // 2. Per-task token estimation (ordered, so refs resolve correctly)
  const taskTokenMap = new Map<string, number>();
  let taskTokens = 0;

  const task = plan.task;
  if (task) {
    const inputTokens = estimateInputTokens(task, taskTokenMap);
    taskTokenMap.set(task.task_id, inputTokens);
    taskTokens += inputTokens + OUTPUT_BUFFER_PER_TASK + TASK_PROMPT_OVERHEAD;
  }

  const rawTotal = messageTokens + taskTokens;
  return Math.ceil(rawTotal * SAFETY_MULTIPLIER);
}

async function planWithLLM(messages: ChatMessage[]) {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    throw new Error("No user message found for planning");
  }

  const contextMessages = messages.slice(0, messages.lastIndexOf(lastUserMessage));
  const contextStr = contextMessages
    .map((m, i) => `${i + 1}. [${m.role}] ${m.content}`)
    .join("\n");

  const systemPrompt = `
    You are a strict JSON planner for a decentralized AI execution system.

    Rules:
    - Output ONLY valid JSON
    - No explanation
    - No markdown
    - CREATE EXACTLY ONE TASK
    - The last user message is the task to execute
    - All earlier user and assistant messages are context only and must not become separate tasks

    Context messages:
${contextStr || "(none)"}

    Task message:
    [user] ${lastUserMessage.content}

    Allowed task types:
    - summarization
    - translation
    - classification
    - extract_text

    Schema:
    {
      "task": {
            "task_id": "string",
            "type": "string",
            "input": {
                "type": "text | file_url | ref",
                "data": "string"
            },
            "expected_output": "text",
            "dependencies": []
      },
      "metadata": {
        "system_prompts": ["string"]
      },
        "constraints": {
            "priority": "low_cost | low_latency | balanced",
            "quality": "low | medium | high"
        }
    }`;

  try {
    const response = await client.chat.completions.create({
      model: "meta/llama-3.2-3b-instruct",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.2
    });

    return response.choices[0].message.content || "";
  } catch (err) {
    console.warn("LLM request failed:", err);
    return;
  }
}


function extractSystemPrompts(messages: ChatMessage[]): string[] {
  return messages
    .filter(m => m.role === "system")
    .map(m => m.content);
}

function extractContextMessages(messages: ChatMessage[]): JsonRecord[] {
  const userMessages = messages.filter(m => m.role === "user");
  const lastUserMessage = userMessages[userMessages.length - 1];

  if (!lastUserMessage) {
    return [];
  }

  const lastUserIndex = messages.lastIndexOf(lastUserMessage);

  return messages
    .slice(0, lastUserIndex)
    .filter(m => m.role === "user" || m.role === "assistant")
    .map(m => ({ role: m.role, content: m.content }));
}

function createJob(plan: any, messages: ChatMessage[], constraints: any, userAddress: string) {
  const taskId = generateTaskId(plan.task.type);

  const jobPlan: Prisma.InputJsonValue = {
    task: {
      ...plan.task,
      task_id: taskId
    },
    context: extractContextMessages(messages),
    metadata: {
      system_prompts: extractSystemPrompts(messages)
    }
  };

  const job = {
    created_at: Date.now(),
    status: "pending",

    plan: jobPlan,

    max_token_amount: estimateMaxTokenAmount(plan, messages),
    deadline: constraints.deadline,
    priority: constraints.priority,
    quality: constraints.quality,

    minReputation: constraints.min_reputation ?? 0,

    createdBy: userAddress
  };

  return job;
}

export async function createJobFromRequest(request: ChatCompletionRequest) {
  const intent = extractUserIntent(request.messages);
  console.log("User Intent:", intent);

  const rawPlan = await planWithLLM(request.messages);
  if (!rawPlan) {
    throw new Error("Failed to generate plan from LLM");
  }

  console.log("RAW PLAN:", rawPlan);

  const parsed = safeParseJSON(rawPlan);

  const validPlan = validatePlan(parsed);

  const constraints = mapConstraints(validPlan.constraints, request.strategy);

  const job = createJob(
    validPlan,
    request.messages,
    constraints,
    request.metadata?.userId || "0xabc..."
  );

  return job;
}