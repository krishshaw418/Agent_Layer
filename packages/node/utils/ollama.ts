import type {
  DaemonCheckResult,
  ModelCheckResult,
  OllamaGenerateResponse,
  OllamaShowResponse,
  OllamaTagsResponse,
} from "../types.js";

export const OLLAMA_HOST = process.env["OLLAMA_HOST"] ?? "http://localhost:11434";

// Core fetch wrapper
async function ollamaFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${OLLAMA_HOST}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama API error ${res.status}: ${text}`);
  }

  return res;
}

// Public API
export async function checkDaemon(): Promise<DaemonCheckResult> {
  try {
    const res = await ollamaFetch("/api/tags", { method: "GET" });
    const data = (await res.json()) as OllamaTagsResponse;
    return { ok: true, models: data.models ?? [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function checkModel(modelName: string): Promise<ModelCheckResult> {
  const result = await checkDaemon();

  if (!result.ok) {
    return { running: false, error: result.error };
  }

  const { models } = result;
  const match = models.find(
    (m) => m.name === modelName || m.name.startsWith(`${modelName}:`)
  );

  return match
    ? { running: true, model: match, allModels: models.map((m) => m.name) }
    : { running: false, allModels: models.map((m) => m.name) };
}

export async function getModelInfo(modelName: string): Promise<OllamaShowResponse | null> {
  try {
    const res = await ollamaFetch("/api/show", {
      method: "POST",
      body: JSON.stringify({ name: modelName }),
    });
    return (await res.json()) as OllamaShowResponse;
  } catch {
    return null;
  }
}

export interface GenerateOptions {
  num_predict?: number;
  temperature?: number;
}

export async function generate(
  modelName: string,
  prompt: string,
  options: GenerateOptions = {}
): Promise<OllamaGenerateResponse> {
  const body = {
    model: modelName,
    prompt,
    stream: false,
    ...options,
  };

  const res = await ollamaFetch("/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return (await res.json()) as OllamaGenerateResponse;
}