import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function PlaygroundPanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[1.75rem] border border-white/10 p-5 shadow-glow",
        className
      )}
      {...props}
    />
  );
}
