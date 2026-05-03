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
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase text-black tracking-tight leading-none">Purchase Tokens</h1>
            <p className="text-lg font-bold text-gray-700 mt-4 max-w-md">Swap USDC for Agent Layer Token (AGL) on Base.</p>
          </div>

          {/* Balances Display */}
          <div className="flex flex-col gap-3 min-w-fit">
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase tracking-widest text-black">AGL Balance</p>
              <p className="text-lg font-black text-[#7a00ff] mt-1">
                {isLoadingBalances ? "..." : aglBalance ? parseFloat(aglBalance).toFixed(2) : "—"} AGL
              </p>
            </div>
            <div className="border-[3px] border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black uppercase tracking-widest text-black">USDC Balance</p>
              <p className="text-lg font-black text-black mt-1">
                {isLoadingBalances ? "..." : usdcBalance ? parseFloat(usdcBalance).toFixed(2) : "—"} USDC
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Exchange Rate Info */}
          <div className="flex flex-col sm:flex-row gap-4">
            {rate && (
              <div className="flex-1 border-[3px] border-black bg-[#7a00ff] p-4 text-sm font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <p>
                  1 USDC = {ethers.formatUnits(rate, 6)} AGL
                </p>
              </div>
            )}

            {/* AGL to Output Tokens Info */}
            <div className="flex-1 border-[3px] border-black bg-white p-4 text-sm font-black uppercase tracking-widest text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p>1 AGL = 1,000,000 outputs</p>
            </div>
          </div>

          <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <label className="text-sm font-black uppercase tracking-widest text-black">You pay (USDC)</label>
            <div className="mt-3 flex gap-3">
              <Input
                value={usdcAmount}
                onChange={(e) => handleUsdcChange(e.target.value)}
                placeholder="0.0"
                type="number"
                disabled={isLoadingRate}
                className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
              />
              <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <DollarSign className="h-4 w-4 text-white" />
                <span className="text-sm font-black uppercase text-white">USDC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center py-2">
            {isLoadingRate ? (
              <Loader className="h-8 w-8 text-[#7a00ff] animate-spin" />
            ) : (
              <Repeat className="h-8 w-8 text-black" />
            )}
          </div>

          <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <label className="text-sm font-black uppercase tracking-widest text-black">You receive (AGL)</label>
            <div className="mt-3 flex gap-3">
              <Input
                value={aglAmount}
                onChange={(e) => handleAglChange(e.target.value)}
                placeholder="0.0"
                type="number"
                disabled={isLoadingRate}
                className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
              />
              <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-[#7a00ff] px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm font-black uppercase text-white">AGL</span>
              </div>
            </div>
            {aglAmount.trim() && !isNaN(parseFloat(aglAmount)) && (
              <p className="text-xs font-bold text-gray-500 uppercase mt-4">
                = {(parseFloat(aglAmount) * 1_000_000).toLocaleString()} output tokens
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={() => router.push("/api-keys")} variant="ghost" className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all py-6">
              Back
            </Button>
            <Button onClick={handlePurchase} disabled={isDisabled} className="flex-1 bg-[#7a00ff] text-white hover:bg-[#6000d6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase py-6">
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
