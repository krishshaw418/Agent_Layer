"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CopyableCodeProps {
  code: string;
}

export function CopyableCode({ code }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative group bg-gray-100 border-[2px] border-black p-4 my-6 overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-white border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all z-10"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600 font-black" />
        ) : (
          <Copy className="h-4 w-4 text-black font-black" />
        )}
      </button>
      <div className="overflow-x-auto pr-12">
        <pre className="text-sm font-mono text-black m-0">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
