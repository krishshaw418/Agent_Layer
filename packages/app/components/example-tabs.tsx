"use client";

import { useState } from "react";

import { CodeBlock } from "@/components/code-block";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExampleTabsProps = {
  curl: string;
  javascript: string;
  typescript: string;
};

const labels = [
  { key: "curl", title: "curl", language: "bash" },
  { key: "javascript", title: "JavaScript", language: "javascript" },
  { key: "typescript", title: "TypeScript", language: "typescript" }
] as const;

export function ExampleTabs(props: ExampleTabsProps) {
  const [active, setActive] = useState<(typeof labels)[number]["key"]>("typescript");
  const current = labels.find((item) => item.key === active) ?? labels[2];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {labels.map((item) => (
          <Button
            key={item.key}
            variant={item.key === active ? "default" : "ghost"}
            size="sm"
            onClick={() => setActive(item.key)}
            className={cn(item.key !== active && "border border-white/10")}
          >
            {item.title}
          </Button>
        ))}
      </div>
      <CodeBlock
        code={props[current.key]}
        language={current.language}
        title={current.title}
      />
    </div>
  );
}

