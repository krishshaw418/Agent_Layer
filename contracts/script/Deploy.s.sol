// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {EntryPoint} from "../src/EntryPoint.sol";
import {Escrow} from "../src/Escrow.sol";
import {AgentLayerToken} from "../src/Token.sol";
import {Vault} from "../src/Vault.sol";


contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address coordinator = vm.envAddress("COORDINATOR_PUBLIC_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Token contract
        uint256 initialSupply = 1_000_000;
        AgentLayerToken token = new AgentLayerToken(initialSupply);
        console.log("Token deployed at:", address(token));

        // Deploy vault contract
        Vault vault = new Vault(IERC20(address(token)), deployer);
        console.log("Vault deployed at:", address(vault));

        // Deploy Escrow contract
        Escrow escrow = new Escrow(address(token), deployer);
        console.log("Escrow deployed at:", address(escrow));

        // Set vault address on escrow contract
        escrow.setVaultAddress(address(vault));
        console.log("Vault address set on escrow");

        // Register escrow with vault contract
        vault.addEScrow(address(escrow));
        console.log("Escrow address added to vault");

        // Deploy EntryPoint contract
        EntryPoint entryPoint = new EntryPoint(address(escrow), coordinator, address(token), address(vault));
        console.log("EntryPoint deployed at:", address(entryPoint));

        // Set entrypoint on the escrow contract
        escrow.setEntryPointAddress(address(entryPoint));
        console.log("EntryPoint address updated on escrow contract");

        // Set entrypoint on the vault contract
        vault.addEntryPoint(address(entryPoint));
        console.log("EntryPoint address updated on vault contract");

        vm.stopBroadcast();
    }
}