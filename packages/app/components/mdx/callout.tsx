import type { ReactNode } from "react";

import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

export function Callout({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "my-6 flex gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4 text-sm text-cyan-50",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <div className="leading-7">{children}</div>
    </div>
  );
}
