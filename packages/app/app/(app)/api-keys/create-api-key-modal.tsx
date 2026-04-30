"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keyName: string) => Promise<void>;
  isLoading?: boolean;
}

export function CreateApiKeyModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: CreateApiKeyModalProps) {
  const [keyName, setKeyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(keyName);
      setKeyName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setKeyName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Create New API Key</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div className="space-y-2">
            <label htmlFor="keyName" className="block text-sm font-medium text-slate-300">
              API Key Name
            </label>
            <Input
              id="keyName"
              type="text"
              placeholder="e.g., Production API Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              disabled={isSubmitting}
              className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
              autoFocus
            />
            <p className="text-xs text-slate-500">
              Give your API key a descriptive name to remember its purpose
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-white/10 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!keyName.trim() || isSubmitting}
              className="flex-1 shadow-[0_12px_36px_rgba(34,211,238,0.22)]"
            >
              {isSubmitting ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
