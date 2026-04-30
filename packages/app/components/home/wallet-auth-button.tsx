"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAddress } from "ethers";
import { SiweMessage } from "siwe";
import { toast } from "sonner";
import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";

import { Button } from "@/components/ui/button";

type ButtonState = "idle" | "connecting" | "authenticating";

export function WalletAuthButton() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [state, setState] = useState<ButtonState>("idle");

  const isBusy = state !== "idle";

  const buttonLabel = useMemo(() => {
    if (state === "connecting") return "Connecting Wallet...";
    if (state === "authenticating") return "Authenticating...";
    if (isAuthenticated) return "Manage API Keys";
    return "Connect Wallet";
  }, [isAuthenticated, state]);

  useEffect(() => {
    if (!isConnected || !address) {
      setIsAuthenticated(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include"
        });
        const data = await res.json();
        const sessionAddress = data?.user?.address as string | undefined;
        setIsAuthenticated(Boolean(sessionAddress && sessionAddress.toLowerCase() === address.toLowerCase()));
      } catch {
        setIsAuthenticated(false);
      }
    };

    void checkSession();
  }, [address, isConnected]);

  // Automatically disconnect wallet if connected but not authenticated (skip during auth process)
  useEffect(() => {
    if (isConnected && !isAuthenticated && state === "idle") {
      void disconnectAsync();
    }
  }, [isConnected, isAuthenticated, state, disconnectAsync]);

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

      setIsAuthenticated(true);
      toast.success("Wallet connected successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      throw new Error(message);
    }
  };

  const generateApiKey = async (walletAddress: string) => {
    router.push("/api-keys");
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
      } else {
        await generateApiKey(walletAddress);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet operation failed";
      toast.error(message);
    } finally {
      setState("idle");
    }
  };

  return (
    <Button size="lg" className="shadow-[0_14px_40px_rgba(34,211,238,0.24)]" onClick={handleClick} disabled={isBusy}>
      {buttonLabel}
      <Wallet className="ml-2 h-4 w-4" />
    </Button>
  );
}
