import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa"

const getJobDetailsAbi = [{
    "type": "function",
    "name": "getJobDetails",
    "inputs": [
        {
            "name": "_jobId",
            "type": "string",
            "internalType": "string"
        }
    ],
    "outputs": [
        {
            "name": "",
            "type": "string",
            "internalType": "string"
        },
        {
            "name": "",
            "type": "address",
            "internalType": "address"
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "",
            "type": "uint8",
            "internalType": "enum EntryPoint.JobPriority"
        },
        {
            "name": "",
            "type": "uint8",
            "internalType": "enum EntryPoint.JobQuality"
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "",
            "type": "uint8",
            "internalType": "enum EntryPoint.JobStatus"
        },
        {
            "name": "",
            "type": "tuple",
            "internalType": "struct EntryPoint.Bid",
            "components": [
                {
                    "name": "bidId",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "jobId",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "bidder",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "createdAt",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "tokenAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "timeToComplete",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "reputationScore",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "status",
                    "type": "uint8",
                    "internalType": "enum EntryPoint.BidStatus"
                },
                {
                    "name": "exists",
                    "type": "bool",
                    "internalType": "bool"
                }
            ]
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        },
        {
            "name": "",
            "type": "uint256",
            "internalType": "uint256"
        }
    ],
    "stateMutability": "view"
}]
const markJobAsFailedAbi = [{
    "type": "function",
    "name": "markJobAsFailed",
    "inputs": [
        {
            "name": "_jobId",
            "type": "string",
            "internalType": "string"
        }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
}]

const jobId = process.env.JOB_ID!;

// workflow
// 1. Call the getJobDetails(jobId) onchain
// 2. Check if the job is expired, if expired, then - send a webhook call to the agentlayer backend to notify job failure
// 3. Call markJobAsFailed(jobId) onchain

async function getJobDetailsOnchain(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, getJobDetailsAbi, provider);
        const jobDetails = await contract.getJobDetails(jobId);
        return jobDetails;
    } catch (error) {
        console.error("Error getting job details:", error);
        throw error;
    }
}

async function notifyJobFailure(jobId: string) {
    try {
        const response = await fetch(`${process.env.NOTIFY_JOB_FAILURE_URL}`, {
            method: "POST",
            headers: {
                "X-Webhook-Secret": process.env.AGENT_LAYER_WEBHOOK_SECRET!,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                jobId: jobId,
            }),
        });
        console.log("Notified job failure response:", response);
        return response;
    } catch (error) {
        console.error("Error notifying job failure:", error);
        throw error;
    }
}

async function markJobAsFailedOnchain(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, markJobAsFailedAbi, wallet);
        const tx = await contract.markJobAsFailed(jobId);
        console.log("Successfully marked job as failed, tx hash: ", tx.hash);
        await tx.wait();
        return tx;
    } catch (error) {
        console.error("Error marking job as failed:", error);
        throw error;
    }
}

async function main() {
    if (!jobId) {
        throw new Error("Job ID is not defined");
    }
    const jobDetails = await getJobDetailsOnchain(jobId);
    console.log("Job details:", jobDetails);
    if (jobDetails[8] === 3n) {
        console.log("Job is failed");
        await notifyJobFailure(jobId);
        await markJobAsFailedOnchain(jobId);
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});