import { ethers } from "ethers";
import { getEntryPointContract, getVaultContract, getAgentLayerTokenContract, getAgentLayerTokenGatewayContract, getUSDCContract, VAULT_CONTRACT_ADDRESS } from "../lib/contracts";

type blockChainCallResponse = {
    success: boolean;
    data?: any;
    error?: string;
}

export async function getVaultBalanceOnChain(userPublicKey: string, signer: ethers.Signer): Promise<blockChainCallResponse> {
    try {
        const vaultContract = getVaultContract(signer);
        const balance = await vaultContract.getBalance(userPublicKey);
        return { success: true, data: balance };
    } catch (error) {
        console.error("Error fetching vault balance:", error);
        return { success: false, error: "Failed to fetch vault balance from chain" };
    }
}

export async function rechargeVaultOnChain(amount: string, signer: ethers.Signer): Promise<blockChainCallResponse> {
    try {
        const parsedAmount = ethers.parseUnits(amount, 6);
        const tokenContract = getAgentLayerTokenContract(signer);

        // amount approval — approve the actual vault contract address
        const approveTx = await tokenContract.approve(VAULT_CONTRACT_ADDRESS, parsedAmount);
        await approveTx.wait();
        
        // Call rechargeVault
        const vaultContract = getVaultContract(signer);
        const tx = await vaultContract.rechargeVault(parsedAmount);
        const receipt = await tx.wait();
        return { success: true, data: receipt };
    } catch (error) {
        console.error("Error recharging vault:", error);
        return { success: false, error: "Failed to recharge vault" };
    }
}

export async function getAGLPerUSDC(signer: ethers.Signer): Promise<blockChainCallResponse> {
    try {
        const gatewayContract = getAgentLayerTokenGatewayContract(signer);
        const rate = await gatewayContract.getTokensPerUSDC();
        return { success: true, data: rate };
    } catch (error) {
        console.error("Error fetching AGL per USDC rate:", error);
        return { success: false, error: "Failed to fetch AGL per USDC rate" };
    }
}

export async function purchaseAGLTokensOnChain(amount: string, signer: ethers.Signer): Promise<blockChainCallResponse> {
  try {
    // AGL has 6 decimals
    const aglAmount = ethers.parseUnits(amount, 6); // BigInt

    const tokensPerUSDCRes = await getAGLPerUSDC(signer);
    if (!tokensPerUSDCRes.success || !tokensPerUSDCRes.data) {
      return { success: false, error: "Unable to fetch tokensPerUSDC" };
    }

    const tokensPerUSDC = tokensPerUSDCRes.data; // BigInt

    const USDC_DECIMALS = BigInt(1_000_000);

    // Calculate required USDC
    const usdcToDeposit =
      (aglAmount * USDC_DECIMALS) / tokensPerUSDC;

    if (usdcToDeposit <= BigInt(0)) {
      return { success: false, error: "Calculated USDC amount is invalid" };
    }

    const gatewayContract = getAgentLayerTokenGatewayContract(signer);
    const usdcContract = getUSDCContract(signer);
    
    const approveTx = await usdcContract.approve(
      await gatewayContract.getAddress(),
      usdcToDeposit
    );
    await approveTx.wait();

    const tx = await gatewayContract.deposit(usdcToDeposit);
    const receipt = await tx.wait();

    return { success: true, data: receipt };

  } catch (error) {
    console.error("Error purchasing AGL tokens:", error);
    return { success: false, error: "Failed to purchase AGL tokens" };
  }
}

export async function sellAGLTokensOnChain(amount: string, signer: ethers.Signer): Promise<blockChainCallResponse> {
  try {
    // AGL has 6 decimals
    const aglAmount = ethers.parseUnits(amount, 6); // BigInt

    const gatewayContract = getAgentLayerTokenGatewayContract(signer);
    const tokenContract = getAgentLayerTokenContract(signer);

    const approveTx = await tokenContract.approve(
      await gatewayContract.getAddress(),
      aglAmount
    );
    await approveTx.wait();

    const tx = await gatewayContract.withdraw(aglAmount);
    const receipt = await tx.wait();

    return { success: true, data: receipt };

  } catch (error) {
    console.error("Error selling AGL tokens:", error);
    return { success: false, error: "Failed to sell AGL tokens" };
  }
}
