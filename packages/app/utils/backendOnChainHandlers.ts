import { ethers } from "ethers";
import { getEntryPointContract } from "../lib/contracts";
import { signer } from "@/lib/blockChain";

const entryPointContract = getEntryPointContract(signer);


type blockChainCallResponse = {
    success: boolean;
    data?: any;
    error?: string;
}

export async function createJobOnChain(jobId: string, creator: string, maxTokenAmount: string, deadline: number, priority: string, quality: string, minReputation: number): Promise<blockChainCallResponse> {
    console.log("Create job with creator:", creator);
    const qualityMapping: Record<string, number> = {
        "cheap": 0,
        "fast": 1,
        "balanced": 2
    };

    const priorityMapping: Record<string, number> = {
        "low": 0,
        "medium": 1,
        "high": 2
    };

    const qualityValue = qualityMapping[quality] ?? 0;
    const priorityValue = priorityMapping[priority] ?? 0;
    const maxToken = ethers.parseUnits(maxTokenAmount, 0);
    console.log("maxToken in correct decimals:", maxToken.toString());
    
    const params = {
        jobId: jobId,
        creator: creator,
        maxTokenAmount: maxToken, // already in correct decimals
        deadline: deadline,
        createdAt: Math.floor(Date.now() / 1000),
        priority: priorityValue,        // enum -> uint8
        quality: qualityValue,         // enum -> uint8
        minReputation: minReputation
    };

    try {
        const tx = await entryPointContract.createJob(params);

        console.log("Create job TX sent:", tx.hash);

        const receipt = await tx.wait();

        console.log("Create job TX confirmed:", receipt);
        return { success: true, data: receipt };
    } catch (err: any) {
        console.error("Error creating job:", err);

        let errorMessage = "Failed to create job on chain";

        if (err?.reason) {
            errorMessage = err.reason;
        } else if (err?.shortMessage) {
            errorMessage = err.shortMessage;
        } else if (err?.message) {
            errorMessage = err.message;
        }

        return { success: false, error: errorMessage };
    }
}

export async function getNodeReputationOnChain(nodePublicKey: string): Promise<blockChainCallResponse> {
    try {
        const reputation = await entryPointContract.getNodeReputation(nodePublicKey);
        return { success: true, data: reputation };
    } catch (err) {
        console.error("Error fetching reputation:", err);
        return { success: false, error: "Failed to fetch reputation from chain" };
    }
}