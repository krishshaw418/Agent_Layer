import { ethers } from "ethers";
import entryPointAbi from "./abi/EntryPoint.json";
import vaultAbi from "./abi/Vault.json";
import AgentLayerTokenAbi from "./abi/AgentLayerToken.json";
import AgentLayerTokenGatewayAbi from "./abi/AgentLayerTokenGateway.json";

const ENTRYPOINT_CONTRACT_ADDRESS = "0x86f4089F7726dc0b4Cfe9B2540A81b12355e6FFa";
export const VAULT_CONTRACT_ADDRESS = "0xdc08392ce04A25fD69FC3e8F93CB086DDC20756E";
const AGENTLAYER_TOKEN_ADDRESS = "0xc638dADe4d60c0E84Cb0C5B11fE49bC555d0e8eb";
const AGENTLAYER_TOKEN_GATEWAY_ADDRESS = "0x802aC028b52ba122Ef89a302333e13e33bf424Fc";
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export function getEntryPointContract(signer: ethers.Signer) {
  return new ethers.Contract(
    ENTRYPOINT_CONTRACT_ADDRESS,
    entryPointAbi.abi,
    signer
  );
}

export function getVaultContract(signer: ethers.Signer) {
  return new ethers.Contract(
    VAULT_CONTRACT_ADDRESS,
    vaultAbi.abi,
    signer
  );
}

export function getAgentLayerTokenContract(signer: ethers.Signer) {
  return new ethers.Contract(
    AGENTLAYER_TOKEN_ADDRESS,
    AgentLayerTokenAbi.abi,
    signer
  );
}

export function getAgentLayerTokenGatewayContract(signer: ethers.Signer) {
  return new ethers.Contract(
    AGENTLAYER_TOKEN_GATEWAY_ADDRESS,
    AgentLayerTokenGatewayAbi.abi,
    signer
  );
}

export function getUSDCContract(signer: ethers.Signer) {
  return new ethers.Contract(
    USDC_ADDRESS,
    [
      "function balanceOf(address owner) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)"
    ],
    signer
  );
}
