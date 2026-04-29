// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AgentLayerToken } from "../src/Token.sol";
import { Escrow } from "../src/Escrow.sol";
import { IVault, Vault } from "../src/Vault.sol";

contract TestEscrow is Escrow {
    constructor(address _token, address _deployer) Escrow(_token, _deployer) {}

    function setVaultForTest(address _vault) external {
        vault = IVault(_vault);
    }
}

contract EscrowTest is Test {
    AgentLayerToken internal token;
    Vault internal vault;
    TestEscrow internal escrow;

    address internal entryPoint = address(0xABC1);
    address internal payer = address(0xABC2);
    address internal payee = address(0xABC3);

    function setUp() public {
        token = new AgentLayerToken(1_000_000);
        vault = new Vault(IERC20(address(token)), address(this));
        escrow = new TestEscrow(address(token), address(this));

        escrow.setEntryPointAddress(entryPoint);
        escrow.setVaultForTest(address(vault));
        vault.addEScrow(address(escrow));

        require(token.transfer(address(escrow), 10_000 ether), "Transfer failed");
    }

    function testOnlyEntryPointCanCreateEscrow() public {
        vm.expectRevert("Only the EntryPoint contract can call this function");
        escrow.createEscrow("job-1", "bid-1", payer, address(0), 100 ether);
    }

    function testSetPayeeAndReleaseFullAmount() public {
        vm.prank(entryPoint);
        escrow.createEscrow("job-1", "bid-1", payer, address(0), 300 ether);

        vm.prank(entryPoint);
        escrow.setPayee("job-1", payee);

        vm.prank(entryPoint);
        escrow.releaseFunds("job-1", 300 ether);

        (, , , address escrowPayee, uint256 amount, bool settled) = escrow.getEscrowDetails("job-1");
        assertEq(escrowPayee, payee);
        assertEq(amount, 300 ether);
        assertTrue(settled);
        assertEq(token.balanceOf(payee), 300 ether);
    }

    function testReleaseWithPartialAmountRefundsPayerThroughVault() public {
        vm.prank(entryPoint);
        escrow.createEscrow("job-2", "bid-2", payer, address(0), 300 ether);

        vm.prank(entryPoint);
        escrow.setPayee("job-2", payee);

        vm.prank(entryPoint);
        escrow.releaseFunds("job-2", 200 ether);

        assertEq(token.balanceOf(payee), 200 ether);

        vm.prank(payer);
        assertEq(vault.getBalance(payer), 100 ether);
    }

    function testRefundMovesEntireAmountBackToVaultForPayer() public {
        vm.prank(entryPoint);
        escrow.createEscrow("job-3", "bid-3", payer, address(0), 250 ether);

        vm.prank(entryPoint);
        escrow.refund("job-3");

        vm.prank(payer);
        assertEq(vault.getBalance(payer), 250 ether);
    }

    function testSetPayeeCannotBeCalledTwice() public {
        vm.prank(entryPoint);
        escrow.createEscrow("job-4", "bid-4", payer, address(0), 100 ether);

        vm.prank(entryPoint);
        escrow.setPayee("job-4", payee);

        vm.prank(entryPoint);
        vm.expectRevert("Payee already set");
        escrow.setPayee("job-4", address(0x1234));
    }
}
