"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

type StreamingOutputProps = {
  output: string;
  isStreaming: boolean;
  placeholder: string;
  usage?: {
    prompt_tokens: number;
    estimated_completion_tokens?: number;
    total_tokens: number;
  } | null;
  costLabel?: string | null;
};

export function StreamingOutput({
  output,
  isStreaming,
  placeholder,
  usage,
  costLabel
}: StreamingOutputProps) {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    node.scrollTop = node.scrollHeight;
  }, [output, isStreaming]);

  async function handleCopy() {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-950/75">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-sm font-medium text-white">Response Stream</p>
          <p className="text-xs text-slate-500">
            {isStreaming ? "Receiving chunks over WebSocket" : "Ready for the next request"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output}>
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          Copy
        </Button>
      </div>
      <div ref={scrollRef} className="min-h-[320px] flex-1 overflow-y-auto px-5 py-4">
        {output ? (
          <div className="animate-fade-up whitespace-pre-wrap font-medium leading-7 text-slate-100">
            {output}
            <span
              className={cn(
                "ml-1 inline-block h-5 w-2 rounded-full bg-cyan-400 align-middle transition-opacity",
                isStreaming ? "opacity-100" : "opacity-0"
              )}
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
            <Sparkles className="h-6 w-6 text-cyan-300" />
            <p className="max-w-sm text-sm text-slate-400">{placeholder}</p>
          </div>
        )}
      </div>
      <div className="grid gap-3 border-t border-white/10 px-5 py-4 sm:grid-cols-3">
        <Metric label="Prompt Tokens" value={usage ? formatNumber(usage.prompt_tokens) : "-"} />
        <Metric label="Total Tokens" value={usage ? formatNumber(usage.total_tokens) : "-"} />
        <Metric label="Estimated Cost" value={costLabel ?? "-"} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}

