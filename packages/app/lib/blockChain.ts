import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

export const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
export const signer = new ethers.Wallet(PRIVATE_KEY, provider);