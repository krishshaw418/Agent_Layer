"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  Sparkles,
  Waves
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ApiKeyInput } from "@/components/api-key-input";
import { StreamingOutput } from "@/components/streaming-output";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { estimateCredits } from "@/lib/pricing";
import { modelOptions } from "@/lib/site";
import { formatCompactNumber } from "@/lib/utils";

type Strategy = "latency" | "cost";
type PlaygroundTab = "chat" | "embeddings";

type UsageSummary = {
  prompt_tokens: number;
  estimated_completion_tokens?: number;
  total_tokens: number;
};

type EmbeddingsResult = {
  object: "list";
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
};

const STORAGE_KEY = "agent-layer-api-key";

export function PlaygroundClient() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("chat");
  const [apiKey, setApiKey] = useState("");
  const [hasLoadedKey, setHasLoadedKey] = useState(false);

  const [chatModel, setChatModel] = useState("agent-gpt-fast");
  const [embeddingModel, setEmbeddingModel] = useState("agent-embed-1");
  const [strategy, setStrategy] = useState<Strategy>("latency");
  const [prompt, setPrompt] = useState("Explain how decentralized AI routing differs from a centralized inference API.");
  const [embeddingInput, setEmbeddingInput] = useState(
    "Distributed compute lets applications route AI jobs across multiple providers."
  );

  const [isChatPending, setIsChatPending] = useState(false);
  const [isEmbeddingPending, setIsEmbeddingPending] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [chatUsage, setChatUsage] = useState<UsageSummary | null>(null);
  const [chatCostLabel, setChatCostLabel] = useState<string | null>(null);
  const [embeddingResult, setEmbeddingResult] = useState<EmbeddingsResult | null>(null);
  const [embeddingCostLabel, setEmbeddingCostLabel] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setApiKey(saved);
    }

    setHasLoadedKey(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedKey) {
      return;
    }

    if (apiKey.trim()) {
      window.localStorage.setItem(STORAGE_KEY, apiKey.trim());
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [apiKey, hasLoadedKey]);

  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  async function runChat() {
    if (!apiKey.trim()) {
      toast.error("Enter an API key to start a chat request.");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Prompt is empty.");
      return;
    }

    socketRef.current?.close();
    setIsChatPending(true);
    setStreamingOutput("");
    setChatUsage(null);
    setChatCostLabel(null);

    try {
      const response = await fetch("/api/playground/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: chatModel,
          prompt: prompt.trim(),
          strategy
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Chat request failed.");
      }

      setChatUsage(payload.usage);
      setChatCostLabel(payload.cost.formatted);

      const wsUrl = `${payload.wsBaseUrl.replace(/^http/, "ws")}/chat/stream?job_id=${payload.jobId}&api_key=${encodeURIComponent(apiKey.trim())}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data) as {
          done?: boolean;
          error?: { message?: string };
          choices?: Array<{
            delta?: {
              content?: string;
            };
          }>;
        };

        if (data.error) {
          toast.error(data.error.message ?? "Streaming error.");
          setIsChatPending(false);
          socket.close();
          return;
        }

        const chunk = data.choices?.[0]?.delta?.content ?? "";

        if (chunk) {
          setStreamingOutput((current) => current + chunk);
        }

        if (data.done) {
          setIsChatPending(false);
          socket.close();
        }
      };

      socket.onerror = () => {
        toast.error("WebSocket connection failed.");
        setIsChatPending(false);
      };

      socket.onclose = () => {
        setIsChatPending(false);
      };
    } catch (error) {
      setIsChatPending(false);
      toast.error(error instanceof Error ? error.message : "Chat request failed.");
    }
  }

  async function runEmbeddings() {
    if (!apiKey.trim()) {
      toast.error("Enter an API key to run embeddings.");
      return;
    }

    if (!embeddingInput.trim()) {
      toast.error("Input is empty.");
      return;
    }

    setIsEmbeddingPending(true);
    setEmbeddingResult(null);
    setEmbeddingCostLabel(null);

    try {
      const response = await fetch("/api/playground/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: embeddingModel,
          input: embeddingInput.trim()
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Embedding request failed.");
      }

      setEmbeddingResult(payload.result);
      setEmbeddingCostLabel(payload.cost.formatted);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Embedding request failed.");
    } finally {
      setIsEmbeddingPending(false);
    }
  }

  const embeddingUsage = embeddingResult?.usage
    ? {
        prompt_tokens: embeddingResult.usage.prompt_tokens,
        total_tokens: embeddingResult.usage.total_tokens
      }
    : null;

  const embeddingPreview = embeddingResult?.data?.[0]?.embedding.slice(0, 12) ?? [];
  const localEstimate =
    activeTab === "chat"
      ? chatUsage
        ? estimateCredits(chatUsage.total_tokens, strategy, "chat")
        : null
      : embeddingUsage
        ? estimateCredits(embeddingUsage.total_tokens, "cost", "embeddings")
        : null;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="grid gap-6 p-0 lg:grid-cols-[1.1fr_1.4fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex flex-wrap gap-2">
              <PlaygroundTabButton
                active={activeTab === "chat"}
                onClick={() => setActiveTab("chat")}
                icon={<Sparkles className="h-4 w-4" />}
                label="Chat"
              />
              <PlaygroundTabButton
                active={activeTab === "embeddings"}
                onClick={() => setActiveTab("embeddings")}
                icon={<Waves className="h-4 w-4" />}
                label="Embeddings"
              />
            </div>
            <div className="space-y-5">
              <ApiKeyInput value={apiKey} onChange={setApiKey} />
              {activeTab === "chat" ? (
                <>
                  <SelectField
                    label="Model"
                    value={chatModel}
                    onChange={setChatModel}
                    options={modelOptions.filter((item) => item.value !== "agent-embed-1")}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Strategy</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <StrategyButton
                        active={strategy === "latency"}
                        label="Latency"
                        description="Prefer lower-latency routing paths."
                        onClick={() => setStrategy("latency")}
                      />
                      <StrategyButton
                        active={strategy === "cost"}
                        label="Cost"
                        description="Prefer cheaper node execution."
                        onClick={() => setStrategy("cost")}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Prompt</label>
                    <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
                  </div>
                  <Button className="w-full" onClick={runChat} disabled={isChatPending}>
                    {isChatPending ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Streaming
                      </>
                    ) : (
                      <>
                        Send Chat
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <SelectField
                    label="Model"
                    value={embeddingModel}
                    onChange={setEmbeddingModel}
                    options={modelOptions.filter((item) => item.value === "agent-embed-1")}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Input</label>
                    <Textarea
                      value={embeddingInput}
                      onChange={(event) => setEmbeddingInput(event.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={runEmbeddings} disabled={isEmbeddingPending}>
                    {isEmbeddingPending ? (
                      <>
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        Generate Embedding
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="p-5">
            {activeTab === "chat" ? (
              <StreamingOutput
                output={streamingOutput}
                isStreaming={isChatPending}
                usage={chatUsage}
                costLabel={chatCostLabel}
                placeholder="Send a prompt to watch a decentralized completion stream in real time."
              />
            ) : (
              <EmbeddingsResultPanel
                result={embeddingResult}
                isPending={isEmbeddingPending}
                usage={embeddingUsage}
                costLabel={embeddingCostLabel}
                preview={embeddingPreview}
              />
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <Badge>Workflow</Badge>
            <CardTitle>Playground flow</CardTitle>
            <CardDescription>
              Chat requests create a job first, then the response is streamed back over WebSocket.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Badge>Usage estimate</Badge>
            <CardTitle>{localEstimate?.formatted ?? "Pending request"}</CardTitle>
            <CardDescription>
              Costs shown here are heuristic developer estimates derived from token counts and strategy hints.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Badge>Vector preview</Badge>
            <CardTitle>
              {embeddingResult?.data?.[0]
                ? `${formatCompactNumber(embeddingResult.data[0].embedding.length)} dims`
                : "No embedding yet"}
            </CardTitle>
            <CardDescription>
              Embeddings are truncated in the UI so you can inspect shape without dumping the full array.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <select
        className="flex h-11 w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StrategyButton({
  active,
  label,
  description,
  onClick
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left transition ${
        active
          ? "border-cyan-400/40 bg-cyan-400/12"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
    </button>
  );
}

function PlaygroundTabButton({
  active,
  label,
  icon,
  onClick
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-cyan-400/40 bg-cyan-400/12 text-cyan-100"
          : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function EmbeddingsResultPanel({
  result,
  isPending,
  usage,
  costLabel,
  preview
}: {
  result: EmbeddingsResult | null;
  isPending: boolean;
  usage: { prompt_tokens: number; total_tokens: number } | null;
  costLabel: string | null;
  preview: number[];
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-950/75">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-sm font-medium text-white">Embedding Output</p>
        <p className="text-xs text-slate-500">Inspect vector shape, token usage, and estimated billing.</p>
      </div>
      <div className="flex-1 space-y-4 px-5 py-4">
        {isPending ? (
          <div className="grid gap-3">
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
          </div>
        ) : result?.data?.[0] ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Vector preview</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {preview.map((value, index) => (
                  <div key={`${value}-${index}`} className="rounded-xl bg-slate-900/80 px-3 py-2 text-xs text-slate-300">
                    {value.toFixed(5)}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <EmbeddingMetric label="Dimensions" value={`${result.data[0].embedding.length}`} />
              <EmbeddingMetric label="Prompt Tokens" value={`${usage?.prompt_tokens ?? "-"}`} />
              <EmbeddingMetric label="Estimated Cost" value={costLabel ?? "-"} />
            </div>
          </>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
            <p className="max-w-sm text-sm text-slate-400">
              Submit text to inspect a generated embedding and the usage metadata returned by the SDK.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function EmbeddingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
