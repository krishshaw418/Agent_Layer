// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {AgentLayerToken} from "../src/Token.sol";

contract TokenTest is Test {
    AgentLayerToken internal token;

    uint256 internal constant INITIAL_SUPPLY = 1_000_000;

    function setUp() public {
        token = new AgentLayerToken(INITIAL_SUPPLY);
    }

    function testMetadata() public view {
        assertEq(token.name(), "AgentLayer Token");
        assertEq(token.symbol(), "AGL");
        assertEq(token.decimals(), 18);
    }

    function testInitialSupplyMintedToDeployer() public view {
        uint256 expected = INITIAL_SUPPLY * 10 ** token.decimals();
        assertEq(token.totalSupply(), expected);
        assertEq(token.balanceOf(address(this)), expected);
    }
}
