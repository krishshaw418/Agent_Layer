"use client";

import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const languageMap: Record<string, string> = {
  shell: "bash",
  sh: "bash",
  js: "javascript",
  ts: "typescript"
};

type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
  className?: string;
};

export function CodeBlock({
  code,
  language = "typescript",
  title,
  className
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const prismLanguage = languageMap[language] ?? language;
  const grammar = Prism.languages[prismLanguage] ?? Prism.languages.typescript;
  const highlighted = useMemo(
    () => Prism.highlight(code.trim(), grammar, prismLanguage),
    [code, grammar, prismLanguage]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95", className)}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {title ?? prismLanguage}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-6 text-slate-100">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

