// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {AgentLayerToken} from "../src/Token.sol";
import {Vault} from "../src/Vault.sol";

contract VaultTest is Test {
    AgentLayerToken internal token;
    Vault internal vault;

    address internal user = address(0x100);
    address internal escrow = address(0x200);
    address internal entryPoint = address(0x300);
    address internal recipient = address(0x400);

    function setUp() public {
        token = new AgentLayerToken(1_000_000);
        vault = new Vault(IERC20(address(token)), address(this));

        require(token.transfer(user, 10_000 ether), "Transfer failed");
        require(token.transfer(escrow, 10_000 ether), "Transfer failed");
    }

    function testRechargeVault() public {
        vm.startPrank(user);
        token.approve(address(vault), 500 ether);
        vault.rechargeVault(500 ether);
        vm.stopPrank();

        vm.prank(user);
        assertEq(vault.getBalance(user), 500 ether);
        assertEq(token.balanceOf(address(vault)), 500 ether);
    }

    function testRechargeVaultRevertsOnZeroAmount() public {
        vm.prank(user);
        vm.expectRevert("Invalid recharge amount");
        vault.rechargeVault(0);
    }

    function testDepositForRequiresEscrowOrEntryPoint() public {
        vm.startPrank(user);
        token.approve(address(vault), 100 ether);
        vm.expectRevert("Only the escrow or entry point can call this function");
        vault.depositFor(user, 100 ether);
        vm.stopPrank();
    }

    function testEscrowCanDepositForUser() public {
        vault.addEScrow(escrow);

        vm.startPrank(escrow);
        token.approve(address(vault), 100 ether);
        vault.depositFor(user, 100 ether);
        vm.stopPrank();

        vm.prank(user);
        assertEq(vault.getBalance(user), 100 ether);
        assertEq(token.balanceOf(address(vault)), 100 ether);
    }

    function testEntryPointCanTransferFromUserVaultBalance() public {
        vm.startPrank(user);
        token.approve(address(vault), 250 ether);
        vault.rechargeVault(250 ether);
        vm.stopPrank();

        vault.addEntryPoint(entryPoint);

        vm.prank(entryPoint);
        vault.transfer(user, recipient, 150 ether);

        vm.prank(user);
        assertEq(vault.getBalance(user), 100 ether);
        assertEq(token.balanceOf(recipient), 150 ether);
    }

    function testTransferRevertsForUnauthorizedCaller() public {
        vm.startPrank(user);
        token.approve(address(vault), 200 ether);
        vault.rechargeVault(200 ether);
        vm.expectRevert("Only the escrow or entry point can call this function");
        vault.transfer(user, recipient, 50 ether);
        vm.stopPrank();
    }
}
