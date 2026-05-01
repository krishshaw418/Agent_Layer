"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Copy, Plus, Trash2, Loader, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateApiKeyModal } from "./create-api-key-modal";
import { DepositModal } from "./deposit-modal";
import { getVaultBalanceOnChain, rechargeVaultOnChain } from "@/utils/userOnChainHandlers";

interface ApiKey {
  id: string;
  KeyName: string;
  KeyStartingCharacter: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { address } = useAccount();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [vaultBalance, setVaultBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    fetchVaultBalance();
  }, [address]);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/developer/api-keys/get-all", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }

      const data = await response.json();
      setApiKeys(data.apiKeys || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch API keys";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVaultBalance = async () => {
    if (!address) {
      setVaultBalance(null);
      return;
    }

    try {
      setIsLoadingBalance(true);
      // Get ethers signer from window.ethereum
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner(address);
      
      const response = await getVaultBalanceOnChain(address, signer);

      if (response.success && response.data) {
        // Vault stores AGT token amounts (6 decimals)
        const balanceInAgt = ethers.formatUnits(response.data, 6);
        setVaultBalance(parseFloat(balanceInAgt).toFixed(4));
      } else {
        throw new Error(response.error || "Failed to fetch balance");
      }
    } catch (error) {
      console.error("Error fetching vault balance:", error);
      toast.error("Failed to fetch vault balance");
      setVaultBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleCreateApiKey = async (keyName: string) => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/developer/api-keys/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          keyName
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create API key");
      }

      const data = await response.json();
      const apiKey = data.apiKey as string;

      // Copy to clipboard
      await navigator.clipboard.writeText(apiKey);
      toast.success("API key created and copied to clipboard");

      // Close modal and refresh list
      setIsModalOpen(false);
      await fetchApiKeys();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create API key";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch("/api/developer/api-keys/revoke", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          apiKeyId: keyId
        })
      });

      if (!response.ok) {
        throw new Error("Failed to revoke API key");
      }

      toast.success("API key revoked successfully");
      await fetchApiKeys();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to revoke API key";
      toast.error(message);
    }
  };

  const handleDeposit = async (amount: string) => {
    if (!address) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setIsDepositing(true);
      // Get ethers signer from window.ethereum
      if (!window.ethereum) {
        throw new Error("Ethereum provider not found");
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner(address);

      const response = await rechargeVaultOnChain(amount, signer);

      if (response.success) {
        toast.success("Vault recharged successfully!");
        setIsDepositModalOpen(false);
        // Refresh vault balance
        await fetchVaultBalance();
      } else {
        throw new Error(response.error || "Failed to recharge vault");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to recharge vault";
      toast.error(message);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {/* Header with Vault Balance */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h1 className="text-5xl font-black text-black uppercase tracking-tight">API Keys</h1>
              <p className="text-lg font-bold text-gray-700 max-w-xl">
                Manage your API keys. Keep them secure and revoke them when no longer needed.
              </p>
            </div>

            {/* Vault Balance Card */}
            <div className="flex flex-col items-end gap-4">
              <div className="border-[3px] border-black bg-white px-6 py-4 shadow-[6px_6px_0px_0px_rgba(122,0,255,1)]">
                <p className="text-xs font-black uppercase tracking-widest text-black mb-1">Vault Balance</p>
                {isLoadingBalance ? (
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-[#7a00ff]" />
                    <p className="text-sm font-bold text-gray-600">Loading...</p>
                  </div>
                ) : (
                  <p className="text-3xl font-black text-[#7a00ff]">
                    {vaultBalance ? `${vaultBalance} AGT` : "—"}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setIsDepositModalOpen(true)}
                disabled={isDepositing}
                className="bg-black text-white hover:bg-gray-800 rounded-none border-[3px] border-transparent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all font-black uppercase text-sm px-6"
                size="lg"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isDepositing ? "Depositing..." : "Recharge Vault"}
              </Button>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end border-t-[3px] border-black pt-8 mt-8">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#7a00ff] text-white hover:bg-[#6000d6] rounded-none border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all font-black uppercase text-sm px-8 py-6"
              disabled={isCreating}
            >
              <Plus className="mr-2 h-5 w-5" />
              {isCreating ? "Creating..." : "Create New API Key"}
            </Button>
          </div>

          {/* API Keys Table */}
          <div className="border-[3px] border-black bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
            <div className="border-b-[3px] border-black bg-gray-50 px-6 py-6">
              <h2 className="text-2xl font-black uppercase text-black">Your API Keys</h2>
              <p className="text-sm font-bold text-gray-600 mt-2 uppercase tracking-wide">
                {apiKeys.length === 0
                  ? "No API keys yet. Create one to get started."
                  : `You have ${apiKeys.length} active API key${apiKeys.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-[#7a00ff]" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-16 bg-white">
                  <p className="text-lg font-bold text-gray-500 uppercase tracking-widest">No API keys created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="px-6 py-4 font-black uppercase tracking-wider border-b-[3px] border-black border-r-[3px]">Name</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider border-b-[3px] border-black border-r-[3px]">Key Preview</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider border-b-[3px] border-black border-r-[3px]">Created</th>
                        <th className="px-6 py-4 font-black uppercase tracking-wider border-b-[3px] border-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr
                          key={key.id}
                          className="border-b-[3px] border-black transition hover:bg-gray-50 last:border-b-0"
                        >
                          <td className="px-6 py-5 font-bold text-black border-r-[3px] border-black">{key.KeyName}</td>
                          <td className="px-6 py-5 font-mono font-bold text-gray-700 border-r-[3px] border-black">
                            {key.KeyStartingCharacter}****
                          </td>
                          <td className="px-6 py-5 font-bold text-gray-600 border-r-[3px] border-black">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-red-600 font-black uppercase hover:bg-red-100 hover:text-red-700 rounded-none border-[2px] border-transparent hover:border-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="border-[3px] border-black bg-[#7a00ff] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
            <h2 className="text-2xl font-black text-white uppercase mb-4 tracking-tight">
              Keep Your Keys Safe
            </h2>
            <ul className="space-y-3 text-lg font-bold text-white/90">
              <li className="flex items-start gap-3">
                <span className="text-black mt-1">◼</span>
                Store your API keys securely and never commit them to version control
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black mt-1">◼</span>
                Use environment variables or a secrets manager to keep keys safe
              </li>
              <li className="flex items-start gap-3">
                <span className="text-black mt-1">◼</span>
                Revoke keys immediately if you suspect they've been compromised
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create API Key Modal */}
      <CreateApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateApiKey}
        isLoading={isCreating}
      />

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSubmit={handleDeposit}
        isLoading={isDepositing}
        userAddress={address}
      />
    </div>
  );
}
