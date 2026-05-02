"use client";

import type { ReactNode } from "react";
import {
  ArrowUpRight,
  LoaderCircle,
  Sparkles,
  Waves,
  Wallet,
  Hash,
  KeyRound,
  EyeOff,
  Eye
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StreamingOutput } from "@/components/streaming-output";

type Strategy = "latency" | "cost" | "balanced";
type PlaygroundTab = "chat" | "embeddings" | "account" | "token";

const STORAGE_KEY = "agent-layer-api-key";

export function PlaygroundClient() {
  const [activeTab, setActiveTab] = useState<PlaygroundTab>("chat");
  const [apiKey, setApiKey] = useState("");
  const [hasLoadedKey, setHasLoadedKey] = useState(false);
  const [visibleKey, setVisibleKey] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#embeddings") setActiveTab("embeddings");
    else if (hash === "#account-balance") setActiveTab("account");
    else if (hash === "#token-estimation") setActiveTab("token");
    else setActiveTab("chat");
  }, []);

  // Chat Parameters
  const [strategy, setStrategy] = useState<Strategy>("balanced");
  const [prompt, setPrompt] = useState("Explain how decentralized AI routing differs from a centralized inference API.");
  const [chatTemperature, setChatTemperature] = useState<string>("0.7");
  const [chatMaxTokens, setChatMaxTokens] = useState<string>("1000");

  // Embedding Parameters
  const [embeddingModel, setEmbeddingModel] = useState("agent-embed-1");
  const [embeddingInput, setEmbeddingInput] = useState(
    "Distributed compute lets applications route AI jobs across multiple providers."
  );

  // Token Parameters
  const [tokenInput, setTokenInput] = useState("Explain how decentralized AI routing works.");
  const [tokenMaxTokens, setTokenMaxTokens] = useState<string>("");

  const [isChatPending, setIsChatPending] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");

  const [isEmbeddingPending, setIsEmbeddingPending] = useState(false);
  const [embeddingResult, setEmbeddingResult] = useState<any>(null);

  const [isAccountPending, setIsAccountPending] = useState(false);
  const [accountBalance, setAccountBalance] = useState<any>(null);

  const [isTokenPending, setIsTokenPending] = useState(false);
  const [tokenResult, setTokenResult] = useState<any>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setApiKey(saved);
    setHasLoadedKey(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedKey) return;
    if (apiKey.trim()) {
      window.localStorage.setItem(STORAGE_KEY, apiKey.trim());
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
  }, [apiKey, hasLoadedKey]);

  async function runChat() {
    if (!apiKey.trim()) return toast.error("Enter an API key to start.");
    if (!prompt.trim()) return toast.error("Prompt is empty.");

    setIsChatPending(true);
    setStreamingOutput("");

    try {
      const response = await fetch("/api/playground/sdk-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          prompt: prompt.trim(),
          strategy,
          temperature: chatTemperature ? Number(chatTemperature) : undefined,
          max_tokens: chatMaxTokens ? Number(chatMaxTokens) : undefined
        })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Chat request failed.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setStreamingOutput((current) => current + chunk);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chat request failed.");
    } finally {
      setIsChatPending(false);
    }
  }

  async function runEmbeddings() {
    if (!apiKey.trim()) return toast.error("Enter an API key.");
    if (!embeddingInput.trim()) return toast.error("Input is empty.");

    setIsEmbeddingPending(true);
    setEmbeddingResult(null);

    try {
      const response = await fetch("/api/playground/sdk-embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), model: embeddingModel, input: embeddingInput.trim() })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Embedding request failed.");
      setEmbeddingResult(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Embedding request failed.");
    } finally {
      setIsEmbeddingPending(false);
    }
  }

  async function runAccountBalance() {
    if (!apiKey.trim()) return toast.error("Enter an API key.");
    setIsAccountPending(true);
    setAccountBalance(null);
    try {
      const response = await fetch("/api/playground/sdk-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Account request failed.");
      setAccountBalance(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account request failed.");
    } finally {
      setIsAccountPending(false);
    }
  }

  async function runTokenEstimation() {
    if (!apiKey.trim()) return toast.error("Enter an API key.");
    if (!tokenInput.trim()) return toast.error("Input is empty.");
    setIsTokenPending(true);
    setTokenResult(null);
    try {
      const response = await fetch("/api/playground/sdk-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          input: tokenInput.trim(),
          max_tokens: tokenMaxTokens ? Number(tokenMaxTokens) : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Token estimation failed.");
      setTokenResult(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Token estimation failed.");
    } finally {
      setIsTokenPending(false);
    }
  }

  return (
    <div className="font-sans text-black">
      <div className="mb-8 border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <label className="flex items-center gap-2 text-sm font-black uppercase text-black">
            <KeyRound className="h-4 w-4" />
            API Key
          </label>
          <div className="flex gap-2">
            <input
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              type={visibleKey ? "text" : "password"}
              autoComplete="off"
              placeholder="al_sk_live_..."
              className="font-mono flex-1 border-[2px] border-black px-3 py-2 outline-none focus:bg-[#f0f0f0]"
            />
            <button
              type="button"
              className="border-[2px] border-black bg-white px-3 py-2 transition-transform active:translate-y-1 hover:bg-gray-100"
              onClick={() => setVisibleKey((current) => !current)}
            >
              {visibleKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs font-bold text-gray-600">
            Stored locally in your browser. Used to authenticate requests directly to the network.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <PlaygroundTabButton
              active={activeTab === "chat"}
              onClick={() => { setActiveTab("chat"); window.location.hash = "chat-completions"; }}
              icon={<Sparkles className="h-4 w-4" />}
              label="Chat Completions"
            />
            <PlaygroundTabButton
              active={activeTab === "embeddings"}
              onClick={() => { setActiveTab("embeddings"); window.location.hash = "embeddings"; }}
              icon={<Waves className="h-4 w-4" />}
              label="Embeddings"
            />
            <PlaygroundTabButton
              active={activeTab === "account"}
              onClick={() => { setActiveTab("account"); window.location.hash = "account-balance"; }}
              icon={<Wallet className="h-4 w-4" />}
              label="Account Balance"
            />
            <PlaygroundTabButton
              active={activeTab === "token"}
              onClick={() => { setActiveTab("token"); window.location.hash = "token-estimation"; }}
              icon={<Hash className="h-4 w-4" />}
              label="Token Estimation"
            />
          </div>

          <div className="border-[2px] border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
            
            {activeTab === "chat" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-black">Strategy</label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <StrategyButton active={strategy === "latency"} label="Latency" onClick={() => setStrategy("latency")} />
                    <StrategyButton active={strategy === "cost"} label="Cost" onClick={() => setStrategy("cost")} />
                    <StrategyButton active={strategy === "balanced"} label="Balanced" onClick={() => setStrategy("balanced")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-black">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full border-[2px] border-black px-3 py-2 outline-none focus:bg-[#f0f0f0]"
                      value={chatTemperature}
                      onChange={(e) => setChatTemperature(e.target.value)}
                      placeholder="0.7"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black uppercase text-black">Max Tokens</label>
                    <input
                      type="number"
                      className="w-full border-[2px] border-black px-3 py-2 outline-none focus:bg-[#f0f0f0]"
                      value={chatMaxTokens}
                      onChange={(e) => setChatMaxTokens(e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-black">Prompt</label>
                  <textarea 
                    rows={4}
                    className="w-full border-[2px] border-black p-3 outline-none focus:bg-[#f0f0f0] resize-none"
                    value={prompt} 
                    onChange={(event) => setPrompt(event.target.value)} 
                  />
                </div>
                
                <button 
                  className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-[#E6FE53] hover:bg-[#D4ED31] text-black font-black uppercase py-3 transition-transform active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={runChat} 
                  disabled={isChatPending}
                >
                  {isChatPending ? (
                    <><LoaderCircle className="h-5 w-5 animate-spin" /> Streaming...</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> Execute Chat</>
                  )}
                </button>
              </div>
            )}

            {activeTab === "embeddings" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-black">Input Text</label>
                  <textarea
                    rows={4}
                    className="w-full border-[2px] border-black p-3 outline-none focus:bg-[#f0f0f0] resize-none"
                    value={embeddingInput}
                    onChange={(event) => setEmbeddingInput(event.target.value)}
                  />
                </div>
                <button 
                  className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-[#E6FE53] hover:bg-[#D4ED31] text-black font-black uppercase py-3 transition-transform active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={runEmbeddings} 
                  disabled={isEmbeddingPending}
                >
                  {isEmbeddingPending ? (
                    <><LoaderCircle className="h-5 w-5 animate-spin" /> Generating...</>
                  ) : (
                    <><Waves className="h-5 w-5" /> Generate Embeddings</>
                  )}
                </button>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-5 text-center py-6">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-black" />
                <p className="text-lg font-bold text-gray-700 max-w-md mx-auto mb-6">
                  Click below to fetch your current account balance using the Agent Layer SDK without any parameters.
                </p>
                <button 
                  className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-[#E6FE53] hover:bg-[#D4ED31] text-black font-black uppercase py-3 transition-transform active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={runAccountBalance} 
                  disabled={isAccountPending}
                >
                  {isAccountPending ? (
                    <><LoaderCircle className="h-5 w-5 animate-spin" /> Fetching...</>
                  ) : (
                    <><Wallet className="h-5 w-5" /> Get Balance</>
                  )}
                </button>
              </div>
            )}

            {activeTab === "token" && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-black">Input Text</label>
                  <textarea
                    rows={4}
                    className="w-full border-[2px] border-black p-3 outline-none focus:bg-[#f0f0f0] resize-none"
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Enter text to estimate token usage"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black uppercase text-black">Max Tokens (Optional)</label>
                  <input
                    type="number"
                    className="w-full border-[2px] border-black px-3 py-2 outline-none focus:bg-[#f0f0f0]"
                    value={tokenMaxTokens}
                    onChange={(e) => setTokenMaxTokens(e.target.value)}
                    placeholder="1000"
                  />
                  <p className="text-xs font-bold text-gray-500">Constraint used to determine estimated completion tokens.</p>
                </div>
                <button 
                  className="w-full flex items-center justify-center gap-2 border-[2px] border-black bg-[#E6FE53] hover:bg-[#D4ED31] text-black font-black uppercase py-3 transition-transform active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={runTokenEstimation} 
                  disabled={isTokenPending}
                >
                  {isTokenPending ? (
                    <><LoaderCircle className="h-5 w-5 animate-spin" /> Estimating...</>
                  ) : (
                    <><Hash className="h-5 w-5" /> Estimate Tokens</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col h-[600px] lg:h-auto border-[2px] border-black bg-[#F5F5F5] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="border-b-[2px] border-black px-5 py-4 bg-black text-white flex justify-between items-center">
            <h3 className="font-black uppercase tracking-wider text-sm flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Response Output
            </h3>
            <span className="text-xs font-mono font-bold px-2 py-1 bg-white text-black border border-white">
              RAW JSON / STREAM
            </span>
          </div>
          
          <div className="flex-1 p-5 overflow-y-auto font-mono text-sm bg-[#1A1A1A] text-[#00FF41]">
            {activeTab === "chat" && (
              isChatPending && !streamingOutput ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <LoaderCircle className="animate-spin h-8 w-8" />
                </div>
              ) : streamingOutput ? (
                <div className="whitespace-pre-wrap">{streamingOutput}</div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 border-[2px] border-dashed border-gray-600 p-6 text-center">
                  Execute chat completion to see real-time streaming output here.
                </div>
              )
            )}
            
            {activeTab === "embeddings" && (
              isEmbeddingPending ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <LoaderCircle className="animate-spin h-8 w-8" />
                </div>
              ) : embeddingResult ? (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(embeddingResult, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 border-[2px] border-dashed border-gray-600 p-6 text-center">
                  Output will be displayed in raw JSON format.
                </div>
              )
            )}

            {activeTab === "account" && (
              isAccountPending ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <LoaderCircle className="animate-spin h-8 w-8" />
                </div>
              ) : accountBalance ? (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(accountBalance, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 border-[2px] border-dashed border-gray-600 p-6 text-center">
                  Output will be displayed in raw JSON format.
                </div>
              )
            )}

            {activeTab === "token" && (
              isTokenPending ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <LoaderCircle className="animate-spin h-8 w-8" />
                </div>
              ) : tokenResult ? (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(tokenResult, null, 2)}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-600 border-[2px] border-dashed border-gray-600 p-6 text-center">
                  Output will be displayed in raw JSON format.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-[2px] border-black px-3 py-2 text-center font-black uppercase text-xs transition-colors ${
        active
          ? "bg-black text-white"
          : "bg-white text-black hover:bg-gray-100"
      }`}
    >
      {label}
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
      className={`inline-flex items-center gap-2 border-[2px] border-black px-4 py-2 font-black uppercase text-sm transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none ${
        active
          ? "bg-[#E6FE53] text-black"
          : "bg-white text-black hover:bg-gray-100"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
