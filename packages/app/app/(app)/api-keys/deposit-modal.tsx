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
      <div className="relative w-full max-w-md border-[3px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b-[3px] border-black px-6 py-5">
          <h2 className="text-xl font-black uppercase text-black tracking-tight">Recharge Vault</h2>
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
            <label htmlFor="amount" className="block text-sm font-black uppercase tracking-widest text-black">
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
              className="border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
              autoFocus
            />
            <p className="text-[11px] font-bold text-gray-600 uppercase">Enter the amount of Agent Layer Token (AGT) you want to deposit into your vault</p>

            <div className="mt-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
              <span className="text-black">AGT Balance: </span>
              {isCheckingBalance ? (
                <span className="ml-2">Checking...</span>
              ) : tokenBalance !== null ? (
                <span className="ml-2 text-[#7a00ff]">{parseFloat(tokenBalance).toFixed(4)} AGT</span>
              ) : (
                <span className="ml-2">—</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting} className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all">
              Cancel
            </Button>

            {insufficient ? (
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  onClick={() => router.push("/purchase-token")}
                  className="flex-1 bg-black text-white hover:bg-gray-800 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase"
                >
                  Purchase Token
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={!amount.trim() || parseFloat(amount) <= 0 || isSubmitting}
                className="flex-1 bg-[#7a00ff] text-white hover:bg-[#6000d6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase"
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
