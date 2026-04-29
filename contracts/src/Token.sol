// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AgentLayerToken is ERC20 {

    constructor(uint256 initialSupply) ERC20("AgentLayer Token", "AGL") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}