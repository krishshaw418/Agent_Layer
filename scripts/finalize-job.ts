import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa"
const isJobExpiredAbi = [
    {
        "type": "function",
        "name": "isJobExpired",
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
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    }
]
const finalizeJobAbi = [
    {
        "type": "function",
        "name": "finalizeJob",
        "inputs": [
            {
                "name": "_jobId",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    }
]
const jobId = process.env.JOB_ID!;

// workflow
// 1. Call the isJobExpired(jobId) function on the smart contract.
// 2. If the response is true, call the finalizeJob(jobId) function on the smart contract.
// 3. Then call another workflow

async function checkIsJobExpired(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, isJobExpiredAbi, provider);
        const isExpired = await contract.isJobExpired(jobId);
        return isExpired;
    } catch (error) {
        console.error("Error checking if job is expired:", error);
        throw error;
    }
}

async function callFinalizeJobOnchain(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, finalizeJobAbi, wallet);
        const tx = await contract.finalizeJob(jobId);
        await tx.wait();
        console.log("Job finalized successfully, tx hash: ", tx.hash);
        return tx;
    } catch (error) {
        console.error("Error finalizing job:", error);
        throw error;
    }
}

async function callNextWorkflow() {
    try {
        const response = await fetch(process.env.NEXT_WORKFLOW_URL!, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
                Accept: "application/vnd.github+json",
            },
            body: JSON.stringify({
                event_type: "check-job-failed",
                client_payload: {
                    jobId,
                },
            }),
        });
        return response;
    } catch (error) {
        console.error("Error calling next workflow:", error);
        throw error;
    }
}

async function main() {
    if (!jobId) {
        throw new Error("Job ID is not defined");
    }
    const isExpired = await checkIsJobExpired(jobId);
    console.log("isJobExpired: ", isExpired);
    if (isExpired) {
        await callFinalizeJobOnchain(jobId);
        // await callNextWorkflow();
        console.log("Called next workflow - avoided on local environment");
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});