"use client";

import { useState, useEffect } from "react";
import { ArrowRight, DollarSign, Repeat, Loader } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAGLPerUSDC, purchaseAGLTokensOnChain } from "@/utils/userOnChainHandlers";
import { getAgentLayerTokenContract, getUSDCContract } from "@/lib/contracts";

export default function PurchaseTokenPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [usdcAmount, setUsdcAmount] = useState("");
  const [aglAmount, setAglAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rate, setRate] = useState<bigint | null>(null);
  const [aglBalance, setAglBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch exchange rate on mount
  useEffect(() => {
    void fetchExchangeRate();
    void fetchBalances();
  }, [address]);

  const fetchExchangeRate = async () => {
    try {
      setIsLoadingRate(true);
      if (!(window as any).ethereum) {
        throw new Error("Ethereum provider not found");
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const response = await getAGLPerUSDC(signer);

      if (response.success && response.data) {
        setRate(response.data as bigint);
      } else {
        toast.error(response.error || "Failed to fetch exchange rate");
      }
    } catch (err) {
      console.error("Error fetching exchange rate:", err);
      toast.error("Failed to fetch exchange rate");
    } finally {
      setIsLoadingRate(false);
    }
  };

  const fetchBalances = async () => {
    if (!address) {
      setAglBalance(null);
      setUsdcBalance(null);
      return;
    }

    try {
      setIsLoadingBalances(true);
      if (!(window as any).ethereum) {
        throw new Error("Ethereum provider not found");
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Fetch AGL balance
      const aglContract = getAgentLayerTokenContract(signer);
      const aglBal = await aglContract.balanceOf(address);
      const aglFormatted = ethers.formatUnits(aglBal, 6);
      setAglBalance(aglFormatted);

      // Fetch USDC balance
      const usdcContract = getUSDCContract(signer);
      const usdcBal = await usdcContract.balanceOf(address);
      const usdcFormatted = ethers.formatUnits(usdcBal, 6);
      setUsdcBalance(usdcFormatted);
    } catch (err) {
      console.error("Error fetching balances:", err);
      setAglBalance(null);
      setUsdcBalance(null);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const calculateAGL = (usdc: string) => {
    if (!usdc.trim() || !rate || rate === BigInt(0)) {
      return "";
    }

    try {
      const usdcAmount = ethers.parseUnits(usdc, 6);
      const USDC_DECIMALS = BigInt(1_000_000);
      const aglCalculated = (usdcAmount * rate) / USDC_DECIMALS;
      return ethers.formatUnits(aglCalculated, 6);
    } catch (err) {
      return "";
    }
  };

  const calculateUSDC = (agl: string) => {
    if (!agl.trim() || !rate || rate === BigInt(0)) {
      return "";
    }

    try {
      const aglAmount = ethers.parseUnits(agl, 6);
      const USDC_DECIMALS = BigInt(1_000_000);
      const usdcCalculated = (aglAmount * USDC_DECIMALS) / rate;
      return ethers.formatUnits(usdcCalculated, 6);
    } catch (err) {
      return "";
    }
  };

  const handleUsdcChange = (value: string) => {
    setUsdcAmount(value);
    if (value.trim()) {
      const calculated = calculateAGL(value);
      setAglAmount(calculated);
    } else {
      setAglAmount("");
    }
  };

  const handleAglChange = (value: string) => {
    setAglAmount(value);
    if (value.trim()) {
      const calculated = calculateUSDC(value);
      setUsdcAmount(calculated);
    } else {
      setUsdcAmount("");
    }
  };

  const handlePurchase = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (!aglAmount.trim() || parseFloat(aglAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      if (!(window as any).ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const response = await purchaseAGLTokensOnChain(aglAmount, signer);

      if (response.success) {
        toast.success("Agent Layer Token purchased successfully!");
        setUsdcAmount("");
        setAglAmount("");
        // Redirect back to api-keys after a short delay
        setTimeout(() => router.push("/api-keys"), 2000);
      } else {
        throw new Error(response.error || "Failed to purchase tokens");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to purchase tokens";
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = !aglAmount.trim() || parseFloat(aglAmount) <= 0 || isProcessing || isLoadingRate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Purchase Agent Layer Token</h1>
            <p className="text-slate-400 mt-2">Swap USDC for Agent Layer Token (AGT) on Base.</p>
          </div>

          {/* Balances Display */}
          <div className="flex flex-col gap-2 min-w-fit">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-xs text-slate-400">AGT Balance</p>
              <p className="text-sm font-medium text-white">
                {isLoadingBalances ? "..." : aglBalance ? parseFloat(aglBalance).toFixed(2) : "—"} AGT
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <p className="text-xs text-slate-400">USDC Balance</p>
              <p className="text-sm font-medium text-white">
                {isLoadingBalances ? "..." : usdcBalance ? parseFloat(usdcBalance).toFixed(2) : "—"} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Exchange Rate Info */}
          {rate && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-200">
              <p>
                1 USDC = {ethers.formatUnits(rate, 6)} AGT
              </p>
            </div>
          )}

          {/* AGL to Output Tokens Info */}
          <div className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-200">
            <p>1 AGT = 1,000,000 output tokens</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <label className="text-xs text-slate-400">You pay (USDC)</label>
            <div className="mt-2 flex gap-2">
              <Input
                value={usdcAmount}
                onChange={(e) => handleUsdcChange(e.target.value)}
                placeholder="0.0"
                type="number"
                disabled={isLoadingRate}
                className="flex-1 border-white/10 bg-white/[0.04] text-white"
              />
              <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2">
                <DollarSign className="h-4 w-4 text-slate-200" />
                <span className="text-sm text-slate-200">USDC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {isLoadingRate ? (
              <Loader className="h-5 w-5 text-slate-400 animate-spin" />
            ) : (
              <Repeat className="h-5 w-5 text-slate-400" />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <label className="text-xs text-slate-400">You receive (AGT)</label>
            <div className="mt-2 flex gap-2">
              <Input
                value={aglAmount}
                onChange={(e) => handleAglChange(e.target.value)}
                placeholder="0.0"
                type="number"
                disabled={isLoadingRate}
                className="flex-1 border-white/10 bg-white/[0.04] text-white"
              />
              <div className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2">
                <span className="text-sm text-slate-200">AGT</span>
              </div>
            </div>
            {aglAmount.trim() && !isNaN(parseFloat(aglAmount)) && (
              <p className="text-xs text-slate-400 mt-2">
                = {(parseFloat(aglAmount) * 1_000_000).toLocaleString()} output tokens
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => router.push("/api-keys")} variant="ghost" className="flex-1">
              Back
            </Button>
            <Button onClick={handlePurchase} disabled={isDisabled} className="flex-1">
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Purchase
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
