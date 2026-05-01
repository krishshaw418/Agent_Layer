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
      <div className="relative w-full max-w-md border-[3px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-5">
          <h2 className="text-xl font-black uppercase text-black tracking-tight">Create New API Key</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-black transition hover:bg-gray-200 disabled:opacity-50 border-[2px] border-transparent hover:border-black p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="space-y-3">
            <label htmlFor="keyName" className="block text-sm font-black uppercase tracking-widest text-black">
              API Key Name
            </label>
            <Input
              id="keyName"
              type="text"
              placeholder="e.g., Production API Key"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              disabled={isSubmitting}
              className="border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
              autoFocus
            />
            <p className="text-[11px] font-bold text-gray-600 uppercase">
              Give your API key a descriptive name to remember its purpose
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!keyName.trim() || isSubmitting}
              className="flex-1 bg-[#7a00ff] text-white hover:bg-[#6000d6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase"
            >
              {isSubmitting ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
