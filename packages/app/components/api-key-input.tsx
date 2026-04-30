"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiKeyInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ApiKeyInput({ value, onChange }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-200">
        <KeyRound className="h-4 w-4 text-cyan-300" />
        API Key
      </label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={visible ? "text" : "password"}
          autoComplete="off"
          placeholder="al_sk_live_..."
          className="font-mono"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        Stored locally in your browser for faster iteration. Do not expose production keys in public deployments.
      </p>
    </div>
  );
}

