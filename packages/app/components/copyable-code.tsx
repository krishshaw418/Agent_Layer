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
    <div className="relative group my-6 overflow-hidden border-[3px] border-black bg-white p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 border-[2px] border-black bg-black p-2 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-[#7a00ff]"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-white font-black" />
        ) : (
          <Copy className="h-4 w-4 text-white font-black" />
        )}
      </button>
      <div className="overflow-x-auto pr-12">
        <pre className="m-0 font-mono text-sm text-black">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
