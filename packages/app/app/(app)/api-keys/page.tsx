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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header with Vault Balance */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white">API Keys</h1>
              <p className="text-slate-400">
                Manage your API keys. Keep them secure and revoke them when no longer needed.
              </p>
            </div>

            {/* Vault Balance Card */}
            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Vault Balance</p>
                {isLoadingBalance ? (
                  <div className="mt-1 flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-cyan-300" />
                    <p className="text-sm text-cyan-100">Loading...</p>
                  </div>
                ) : (
                  <p className="mt-1 text-2xl font-semibold text-cyan-100">
                    {vaultBalance ? `${vaultBalance} AGT` : "—"}
                  </p>
                )}
              </div>
              <Button
                onClick={() => setIsDepositModalOpen(true)}
                disabled={isDepositing}
                className="shadow-[0_12px_36px_rgba(34,211,238,0.22)]"
                size="sm"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isDepositing ? "Depositing..." : "Recharge Vault"}
              </Button>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="shadow-[0_12px_36px_rgba(34,211,238,0.22)]"
              disabled={isCreating}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreating ? "Creating..." : "Create New API Key"}
            </Button>
          </div>

          {/* API Keys Table */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                {apiKeys.length === 0
                  ? "No API keys yet. Create one to get started."
                  : `You have ${apiKeys.length} active API key${apiKeys.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-cyan-300" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">No API keys created yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">
                          Key Preview
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-slate-300">Created</th>
                        <th className="px-4 py-3 text-right font-medium text-slate-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((key) => (
                        <tr
                          key={key.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-4 text-white">{key.KeyName}</td>
                          <td className="px-4 py-4 font-mono text-slate-300">
                            {key.KeyStartingCharacter}****
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            {new Date(key.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeApiKey(key.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="ml-2">Revoke</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-cyan-400/20 bg-cyan-400/10">
            <CardHeader>
              <CardTitle className="text-cyan-100">Keep Your Keys Safe</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-cyan-200">
              <ul className="space-y-2">
                <li>• Store your API keys securely and never commit them to version control</li>
                <li>• Use environment variables or a secrets manager to keep keys safe</li>
                <li>• Revoke keys immediately if you suspect they've been compromised</li>
              </ul>
            </CardContent>
          </Card>
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
