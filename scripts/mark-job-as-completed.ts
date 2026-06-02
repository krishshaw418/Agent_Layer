import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa"

const markJobAsCompletedAbi = [{
    "type": "function",
    "name": "markJobAsCompleted",
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
// 1. Call markJobAsCompleted(jobId) on chain

async function markJobAsCompletedOnchain(jobId: string) {
    try {
        const provder = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provder);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, markJobAsCompletedAbi, wallet);
        const tx = await contract.markJobAsCompleted(jobId);
        await tx.wait();
        console.log("Job marked as completed successfully, tx hash: ", tx.hash);
        return tx;
    } catch (error) {
        console.log("Error marking job as completed: ", error);
        throw error;
    }
}

async function main() {
    await markJobAsCompletedOnchain(jobId);
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});