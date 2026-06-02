import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa"

const getBidCountForJobAbi = [
    {
        "type": "function",
        "name": "getBidCountForJob",
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
                "type": "uint256",
                "internalType": "uint256"
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
const jobId = process.env.JOB_ID!

// workflow
// 1. Call getBidCountForJob(jobId) on the smart contract
// 2. Check if the bid count is >= 5, if yes then - call finalizejob(jobId) on chain  

async function getBidCountForJobOnchain(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, getBidCountForJobAbi, provider);
        const bidCount = await contract.getBidCountForJob(jobId);
        return bidCount;
    } catch (error) {
        console.log("Error while fetching bid count:", error);
        throw error;
    }
}

async function finalizeJobOnchain(jobId: string) {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
        const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, finalizeJobAbi, signer);
        const tx = await contract.finalizeJob(jobId);
        await tx.wait();
        console.log("Job finalized on chain:", jobId);
    } catch (error) {
        console.log("Error while finalizing job:", error);
        throw error;
    }
}

async function main() {
    if (!jobId) {
        throw new Error("Job ID is not defined");
    }
    const bidCount = await getBidCountForJobOnchain(jobId);
    console.log("Bid count:", bidCount);
    if (bidCount >= 5) {
        await finalizeJobOnchain(jobId);
        console.log("Job finalized on chain");
    }
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
