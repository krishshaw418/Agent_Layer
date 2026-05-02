import { ethers } from "ethers";
import { config } from "./config";
import type { EntryPoint } from "../typechain-types";
import { EntryPoint__factory } from "../typechain-types/factories";

const provider = new ethers.JsonRpcProvider(config.rpc_url);
const signer = new ethers.Wallet(config.priv_key, provider);

const contractAddress = config.contract_add;
console.log("Entrypoint contract: ", contractAddress);

// Instantiating the contract object for interacting with the EntryPoint contract
export const contract = EntryPoint__factory.connect(
  contractAddress,
  provider,
) as EntryPoint;

export const contractWithSigner = contract.connect(signer);
