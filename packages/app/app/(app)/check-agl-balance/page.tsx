"use client";

import { useState, useEffect } from "react";
import { ArrowRight, DollarSign, Repeat, Loader, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAGLPerUSDC, purchaseAGLTokensOnChain, sellAGLTokensOnChain } from "@/utils/userOnChainHandlers";
import { getAgentLayerTokenContract, getUSDCContract } from "@/lib/contracts";

export default function CheckAGLBalancePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"view" | "sell" | "buy">("view");

  // Sell state
  const [sellAglAmount, setSellAglAmount] = useState("");
  const [sellUsdcAmount, setSellUsdcAmount] = useState("");
  const [isSellingProcessing, setIsSellingProcessing] = useState(false);

  // Buy state
  const [buyUsdcAmount, setBuyUsdcAmount] = useState("");
  const [buyAglAmount, setBuyAglAmount] = useState("");
  const [isBuyingProcessing, setIsBuyingProcessing] = useState(false);

  // Common state
  const [isProcessingRate, setIsProcessingRate] = useState(false);
  const [rate, setRate] = useState<bigint | null>(null);
  const [aglBalance, setAglBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Fetch exchange rate and balances
  useEffect(() => {
    void fetchExchangeRate();
    void fetchBalances();
  }, [address, isConnected]);

  const fetchExchangeRate = async () => {
    try {
      setIsProcessingRate(true);
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
    } finally {
      setIsProcessingRate(false);
    }
  };

  const fetchBalances = async () => {
    if (!address || !isConnected) {
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

  const calculateAGLFromUSDC = (usdc: string) => {
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

  const calculateUSDCFromAGL = (agl: string) => {
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

  // SELL handlers
  const handleSellAglChange = (value: string) => {
    setSellAglAmount(value);
    if (value.trim()) {
      const calculated = calculateUSDCFromAGL(value);
      setSellUsdcAmount(calculated);
    } else {
      setSellUsdcAmount("");
    }
  };

  const handleSellUsdcChange = (value: string) => {
    setSellUsdcAmount(value);
    if (value.trim()) {
      const calculated = calculateAGLFromUSDC(value);
      setSellAglAmount(calculated);
    } else {
      setSellAglAmount("");
    }
  };

  const handleSell = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (!sellAglAmount.trim() || parseFloat(sellAglAmount) <= 0) {
      toast.error("Please enter a valid AGL amount");
      return;
    }

    if (!aglBalance || parseFloat(sellAglAmount) > parseFloat(aglBalance)) {
      toast.error("Insufficient AGL balance");
      return;
    }

    try {
      setIsSellingProcessing(true);
      if (!(window as any).ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const response = await sellAGLTokensOnChain(sellAglAmount, signer);

      if (response.success) {
        toast.success("AGL tokens sold successfully!");
        setSellAglAmount("");
        setSellUsdcAmount("");
        await fetchBalances();
      } else {
        throw new Error(response.error || "Failed to sell tokens");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sell tokens";
      toast.error(message);
    } finally {
      setIsSellingProcessing(false);
    }
  };

  // BUY handlers
  const handleBuyUsdcChange = (value: string) => {
    setBuyUsdcAmount(value);
    if (value.trim()) {
      const calculated = calculateAGLFromUSDC(value);
      setBuyAglAmount(calculated);
    } else {
      setBuyAglAmount("");
    }
  };

  const handleBuyAglChange = (value: string) => {
    setBuyAglAmount(value);
    if (value.trim()) {
      const calculated = calculateUSDCFromAGL(value);
      setBuyUsdcAmount(calculated);
    } else {
      setBuyUsdcAmount("");
    }
  };

  const handleBuy = async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    if (!buyAglAmount.trim() || parseFloat(buyAglAmount) <= 0) {
      toast.error("Please enter a valid AGL amount");
      return;
    }

    if (!usdcBalance || parseFloat(buyUsdcAmount) > parseFloat(usdcBalance)) {
      toast.error("Insufficient USDC balance");
      return;
    }

    try {
      setIsBuyingProcessing(true);
      if (!(window as any).ethereum) {
        throw new Error("Ethereum provider not found");
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const response = await purchaseAGLTokensOnChain(buyAglAmount, signer);

      if (response.success) {
        toast.success("AGL tokens purchased successfully!");
        setBuyUsdcAmount("");
        setBuyAglAmount("");
        await fetchBalances();
      } else {
        throw new Error(response.error || "Failed to purchase tokens");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to purchase tokens";
      toast.error(message);
    } finally {
      setIsBuyingProcessing(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <div className="border-[3px] border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black uppercase text-black">Connect Wallet</h2>
            <p className="text-gray-700 mt-4 font-bold">Please connect your wallet to check your AGL balance and trade tokens.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase text-black tracking-tight leading-none">
              AGL Balance
            </h1>
            <p className="text-lg font-bold text-gray-700 mt-4 max-w-md">
              Check your balance and trade Agent Layer Token (AGL) for USDC.
            </p>
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

        {/* Exchange Rate Info */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {rate && (
            <div className="flex-1 border-[3px] border-black bg-[#7a00ff] p-4 text-sm font-black uppercase tracking-widest text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <p>
                1 USDC = {ethers.formatUnits(rate, 6)} AGL
              </p>
            </div>
          )}

          <div className="flex-1 border-[3px] border-black bg-white p-4 text-sm font-black uppercase tracking-widest text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p>1 AGL = 1,000,000 outputs</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b-[3px] border-black mb-8 flex gap-0">
          <button
            onClick={() => {
              setActiveTab("view");
              setSellAglAmount("");
              setSellUsdcAmount("");
              setBuyUsdcAmount("");
              setBuyAglAmount("");
            }}
            className={`px-6 py-4 font-black uppercase text-sm border-[3px] border-black border-b-0 ${
              activeTab === "view"
                ? "bg-[#7a00ff] text-white"
                : "bg-white text-black hover:bg-gray-100"
            } shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] transition-all`}
          >
            View Balance
          </button>
          <button
            onClick={() => {
              setActiveTab("sell");
              setSellAglAmount("");
              setSellUsdcAmount("");
            }}
            className={`px-6 py-4 font-black uppercase text-sm border-[3px] border-black border-b-0 ${
              activeTab === "sell"
                ? "bg-[#7a00ff] text-white"
                : "bg-white text-black hover:bg-gray-100"
            } shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] transition-all`}
          >
            Sell AGL
          </button>
          <button
            onClick={() => {
              setActiveTab("buy");
              setBuyUsdcAmount("");
              setBuyAglAmount("");
            }}
            className={`px-6 py-4 font-black uppercase text-sm border-[3px] border-black border-b-0 ${
              activeTab === "buy"
                ? "bg-[#7a00ff] text-white"
                : "bg-white text-black hover:bg-gray-100"
            } shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] transition-all`}
          >
            Buy AGL
          </button>
        </div>

        {/* Content */}
        <div className="mt-8 space-y-6">
          {/* VIEW TAB */}
          {activeTab === "view" && (
            <div className="border-[3px] border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black uppercase text-black mb-4">Your Holdings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-[3px] border-black bg-[#f0f0f0] p-4">
                      <p className="text-xs font-black uppercase text-gray-600 mb-2">AGL Tokens</p>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-[#7a00ff]" />
                        <p className="text-2xl font-black text-[#7a00ff]">
                          {isLoadingBalances ? "..." : aglBalance ? parseFloat(aglBalance).toFixed(2) : "0.00"}
                        </p>
                      </div>
                    </div>
                    <div className="border-[3px] border-black bg-[#f0f0f0] p-4">
                      <p className="text-xs font-black uppercase text-gray-600 mb-2">USDC Tokens</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-black" />
                        <p className="text-2xl font-black text-black">
                          {isLoadingBalances ? "..." : usdcBalance ? parseFloat(usdcBalance).toFixed(2) : "0.00"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {aglBalance && usdcBalance && (
                  <div>
                    <h3 className="text-lg font-black uppercase text-black mb-3">Summary</h3>
                    <div className="bg-blue-50 border-[3px] border-blue-200 p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-bold">Total AGL Value:</span> {(parseFloat(aglBalance) * 1_000_000).toLocaleString()} output tokens
                      </p>
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-bold">Wallet Address:</span> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-8">
                <Button
                  onClick={() => router.push("/api-keys")}
                  variant="ghost"
                  className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all py-6"
                >
                  Back
                </Button>
                <Button
                  onClick={fetchBalances}
                  disabled={isLoadingBalances}
                  variant="ghost"
                  className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all py-6"
                >
                  {isLoadingBalances ? "Refreshing..." : "Refresh Balance"}
                </Button>
              </div>
            </div>
          )}

          {/* SELL TAB */}
          {activeTab === "sell" && (
            <div className="space-y-6">
              <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-sm font-black uppercase tracking-widest text-black">You sell (AGL)</label>
                <div className="mt-3 flex gap-3">
                  <Input
                    value={sellAglAmount}
                    onChange={(e) => handleSellAglChange(e.target.value)}
                    placeholder="0.0"
                    type="number"
                    disabled={isProcessingRate || isSellingProcessing}
                    className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-[#7a00ff] px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <TrendingDown className="h-4 w-4 text-white" />
                    <span className="text-sm font-black uppercase text-white">AGL</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mt-2">
                  Available: {aglBalance ? parseFloat(aglBalance).toFixed(2) : "0.00"} AGL
                </p>
              </div>

              <div className="flex items-center justify-center py-2">
                <Repeat className="h-8 w-8 text-black" />
              </div>

              <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-sm font-black uppercase tracking-widest text-black">You receive (USDC)</label>
                <div className="mt-3 flex gap-3">
                  <Input
                    value={sellUsdcAmount}
                    onChange={(e) => handleSellUsdcChange(e.target.value)}
                    placeholder="0.0"
                    type="number"
                    disabled={isProcessingRate || isSellingProcessing}
                    className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <DollarSign className="h-4 w-4 text-white" />
                    <span className="text-sm font-black uppercase text-white">USDC</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setActiveTab("view")}
                  variant="ghost"
                  className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all py-6"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSell}
                  disabled={!sellAglAmount.trim() || parseFloat(sellAglAmount) <= 0 || isSellingProcessing || isProcessingRate}
                  className="flex-1 bg-[#7a00ff] text-white hover:bg-[#6000d6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase py-6"
                >
                  {isSellingProcessing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Sell AGL
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* BUY TAB */}
          {activeTab === "buy" && (
            <div className="space-y-6">
              <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-sm font-black uppercase tracking-widest text-black">You pay (USDC)</label>
                <div className="mt-3 flex gap-3">
                  <Input
                    value={buyUsdcAmount}
                    onChange={(e) => handleBuyUsdcChange(e.target.value)}
                    placeholder="0.0"
                    type="number"
                    disabled={isProcessingRate || isBuyingProcessing}
                    className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-black px-5 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <DollarSign className="h-4 w-4 text-white" />
                    <span className="text-sm font-black uppercase text-white">USDC</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase mt-2">
                  Available: {usdcBalance ? parseFloat(usdcBalance).toFixed(2) : "0.00"} USDC
                </p>
              </div>

              <div className="flex items-center justify-center py-2">
                {isProcessingRate ? (
                  <Loader className="h-8 w-8 text-[#7a00ff] animate-spin" />
                ) : (
                  <Repeat className="h-8 w-8 text-black" />
                )}
              </div>

              <div className="border-[3px] border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <label className="text-sm font-black uppercase tracking-widest text-black">You receive (AGL)</label>
                <div className="mt-3 flex gap-3">
                  <Input
                    value={buyAglAmount}
                    onChange={(e) => handleBuyAglChange(e.target.value)}
                    placeholder="0.0"
                    type="number"
                    disabled={isProcessingRate || isBuyingProcessing}
                    className="flex-1 border-[3px] border-black bg-white text-black font-bold rounded-none focus-visible:ring-0 focus-visible:border-[#7a00ff] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-6 px-4 placeholder:text-gray-400"
                  />
                  <div className="flex items-center gap-2 rounded-none border-[3px] border-black bg-[#7a00ff] px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <TrendingUp className="h-4 w-4 text-white" />
                    <span className="text-sm font-black uppercase text-white">AGL</span>
                  </div>
                </div>
                {buyAglAmount.trim() && !isNaN(parseFloat(buyAglAmount)) && (
                  <p className="text-xs font-bold text-gray-500 uppercase mt-4">
                    = {(parseFloat(buyAglAmount) * 1_000_000).toLocaleString()} output tokens
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => setActiveTab("view")}
                  variant="ghost"
                  className="flex-1 border-[3px] border-black text-black hover:bg-gray-100 rounded-none font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all py-6"
                >
                  Back
                </Button>
                <Button
                  onClick={handleBuy}
                  disabled={!buyAglAmount.trim() || parseFloat(buyAglAmount) <= 0 || isBuyingProcessing || isProcessingRate}
                  className="flex-1 bg-[#7a00ff] text-white hover:bg-[#6000d6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all rounded-none font-black uppercase py-6"
                >
                  {isBuyingProcessing ? (
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
          )}
        </div>
      </div>
    </div>
  );
}
