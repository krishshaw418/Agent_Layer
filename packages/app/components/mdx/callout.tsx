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
        "my-6 flex gap-3 border-[3px] border-black bg-[#7a00ff] px-4 py-4 text-sm text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] [&_a]:text-white [&_a]:underline [&_p]:text-white [&_strong]:text-white [&_li]:text-white",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-white" />
      <div className="leading-7 font-medium text-white">{children}</div>
    </div>
  );
}
