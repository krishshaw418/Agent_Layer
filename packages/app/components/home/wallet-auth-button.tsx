"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAddress } from "ethers";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { Wallet, LogOut } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

type ButtonState = "idle" | "connecting" | "authenticating";

export function WalletAuthButton({ className, mode = "hero" }: { className?: string, mode?: "hero" | "navbar" }) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const queryClient = useQueryClient();

  const { data: isAuthenticated } = useQuery({
    queryKey: ["auth-session", address],
    queryFn: async () => {
      if (!isConnected || !address) return false;
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        });
        if (!res.ok) return false;
        const data = await res.json();
        const sessionAddress = data?.user?.address as string | undefined;
        return Boolean(sessionAddress && sessionAddress.toLowerCase() === address.toLowerCase());
      } catch {
        return false;
      }
    },
    enabled: isConnected && !!address,
    initialData: false,
  });

  const [state, setState] = useState<ButtonState>("idle");

  const isBusy = state !== "idle";

  const buttonLabel = useMemo(() => {
    if (state === "connecting") return "Connecting...";
    if (state === "authenticating") return "Authenticating...";
    
    if (mode === "navbar") {
      if (isAuthenticated && address) return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      return "Connect Wallet";
    } else {
      if (isAuthenticated) return "Get API key";
      return "Connect Wallet";
    }
  }, [isAuthenticated, state, mode, address]);

  // Removed local checkSession useEffect. Handled by React Query.

  // Removed auto-disconnect to support multiple wallet buttons (Navbar + Hero)

  const authenticateWallet = async (walletAddress: string) => {
    const normalizedAddress = walletAddress.toLowerCase();
    const checksumAddress = getAddress(normalizedAddress);
    setState("authenticating");
    
    try {
      const nonceRes = await fetch(`/api/auth/nonce?publicKey=${encodeURIComponent(normalizedAddress)}`, {
        method: "GET",
        credentials: "include"
      });
      if (!nonceRes.ok) {
        throw new Error("Unable to fetch nonce");
      }

      console.log("Nonce response:", await nonceRes.clone().text());
      const { nonce } = (await nonceRes.json()) as { nonce: string };

      const message = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: "Sign in to Agent Layer",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce
      });

      const preparedMessage = message.prepareMessage();
      
      let signature: string;
      try {
        signature = await signMessageAsync({ message: preparedMessage });
      } catch (signError) {
        const errorMessage = signError instanceof Error ? signError.message : "Failed to sign message";
        throw new Error(`Signature error: ${errorMessage}`);
      }

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          message: preparedMessage,
          signature
        })
      });

      if (!verifyRes.ok) {
        throw new Error("Signature verification failed");
      }

      await queryClient.invalidateQueries({ queryKey: ["auth-session", address] });
      toast.success("Wallet connected successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      throw new Error(message);
    }
  };

  const generateApiKey = async (walletAddress: string) => {
    router.push("/api-keys");
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await disconnectAsync();
    await queryClient.invalidateQueries({ queryKey: ["auth-session", address] });
  };

  const handleClick = async () => {
    if (isBusy) return;

    try {
      let walletAddress = address;

      if (!isConnected || !walletAddress) {
        setState("connecting");
        const connector = connectors.find((item) => item.id === "metaMask") ?? connectors[0];
        if (!connector) {
          throw new Error("No wallet connector available");
        }

        const connected = await connectAsync({ connector });
        walletAddress = connected.accounts?.[0];
        
        // Ensure the connection is established
        if (!walletAddress || !connected) {
          throw new Error("Failed to connect wallet");
        }
      }

      if (!walletAddress) {
        throw new Error("Wallet address not found after connecting");
      }

      if (!isAuthenticated) {
        await authenticateWallet(walletAddress);
      } else if (mode === "hero") {
        await generateApiKey(walletAddress);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet operation failed";
      toast.error(message);
    } finally {
      setState("idle");
    }
  };

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) {
    return (
      <Button size="lg" className={`${className} opacity-0`}>
        Loading...
      </Button>
    );
  }

  return (
    <Button size="lg" className={className} onClick={mode === "navbar" && isAuthenticated ? undefined : handleClick} disabled={isBusy}>
      {buttonLabel}
      {mode === "navbar" && isAuthenticated ? (
        <LogOut className="ml-2 h-4 w-4 cursor-pointer hover:text-red-500" onClick={handleDisconnect} />
      ) : (
        <Wallet className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
