"use client";

import { Check, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-jsx";
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
    <div className={cn("overflow-hidden border-[3px] border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]", className)}>
      <div className="flex items-center justify-between border-b-[3px] border-black bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-white">
            {title ?? prismLanguage}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleCopy} className="border-[2px] border-white text-white hover:bg-white hover:text-black rounded-none">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <pre className="overflow-x-auto bg-white p-4 text-sm leading-6 text-black">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

