"use client";

import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAgentLayerTokenContract } from "@/lib/contracts";
import { toast } from "sonner";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: string) => Promise<void>;
  isLoading?: boolean;
  userAddress?: string | null;
}

export function DepositModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  userAddress
}: DepositModalProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    void fetchTokenBalance();
  }, [isOpen, userAddress]);

  const fetchTokenBalance = async () => {
    if (!userAddress) {
      setTokenBalance(null);
      return;
    }

    try {
      setIsCheckingBalance(true);
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const tokenContract = getAgentLayerTokenContract(signer);
      const bal = await tokenContract.balanceOf(userAddress);
      const formatted = ethers.formatUnits(bal, 6);
      setTokenBalance(formatted);
    } catch (err) {
      console.error("Failed to fetch token balance:", err);
      setTokenBalance(null);
    } finally {
      setIsCheckingBalance(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount.trim() || parseFloat(amount) <= 0) {
      return;
    }

    // If token balance is known and less than amount, prevent deposit
    if (tokenBalance !== null && !isNaN(parseFloat(tokenBalance)) && parseFloat(tokenBalance) < parseFloat(amount)) {
      toast.error("Insufficient Agent Layer Token balance. Purchase AGT first.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(amount);
      setAmount("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount("");
      onClose();
    }
  };

  const insufficient =
    tokenBalance === null || isNaN(parseFloat(tokenBalance))
      ? false
      : amount.trim() && !isNaN(parseFloat(amount))
      ? parseFloat(tokenBalance) < parseFloat(amount)
      : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Recharge Vault</h2>
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
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300">
              Deposit Amount (AGT)
            </label>
            <Input
              id="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting}
              min="0"
              step="0.0001"
              className="border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500"
              autoFocus
            />
            <p className="text-xs text-slate-500">Enter the amount of Agent Layer Token (AGT) you want to deposit into your vault</p>

            <div className="mt-2 text-sm text-slate-300">
              <span className="text-slate-400">AGT Balance: </span>
              {isCheckingBalance ? (
                <span className="ml-2">Checking...</span>
              ) : tokenBalance !== null ? (
                <span className="ml-2">{parseFloat(tokenBalance).toFixed(4)} AGT</span>
              ) : (
                <span className="ml-2">—</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 border-t border-white/10 pt-4">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting} className="flex-1">
              Cancel
            </Button>

            {insufficient ? (
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  onClick={() => router.push("/purchase-token")}
                  className="flex-1 bg-amber-500 text-white"
                >
                  Purchase Agent Layer Token
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={!amount.trim() || parseFloat(amount) <= 0 || isSubmitting}
                className="flex-1 shadow-[0_12px_36px_rgba(34,211,238,0.22)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Deposit"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
