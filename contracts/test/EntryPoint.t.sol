// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { AgentLayerToken } from "../src/Token.sol";
import { EntryPoint } from "../src/EntryPoint.sol";
import { Escrow } from "../src/Escrow.sol";
import { IVault, Vault } from "../src/Vault.sol";

contract EntryPointTestEscrow is Escrow {
    constructor(address _token, address _deployer) Escrow(_token, _deployer) {}

    function setVaultForTest(address _vault) external {
        vault = IVault(_vault);
    }
}

contract EntryPointTest is Test {
    AgentLayerToken internal token;
    Vault internal vault;
    EntryPoint internal entryPoint;
    EntryPointTestEscrow internal escrow;

    address internal coordinator = address(0xCAFE);
    address internal creator = address(0xBEEF);
    address internal node = address(0xD00D);
    address internal outsider = address(0xAAAA);

    function setUp() public {
        token = new AgentLayerToken(1_000_000);
        vault = new Vault(IERC20(address(token)), address(this));
        escrow = new EntryPointTestEscrow(address(token), address(this));
        entryPoint = new EntryPoint(address(escrow), coordinator, address(token), address(vault));

        escrow.setEntryPointAddress(address(entryPoint));
        escrow.setVaultForTest(address(vault));
        vault.addEScrow(address(escrow));
        vault.addEntryPoint(address(entryPoint));

        require(token.transfer(creator, 10_000 ether), "Transfer failed");

        vm.startPrank(creator);
        token.approve(address(vault), 500 ether);
        vault.rechargeVault(500 ether);
        vm.stopPrank();
    }

    function testCreateJobCreatesEscrowAndMovesFunds() public {
        uint256 deadline = block.timestamp + 1 days;

        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-1",
                creator: creator,
                maxTokenAmount: 300 ether,
                deadline: deadline,
                createdAt: 1_700_000_000,
                priority: EntryPoint.JobPriority.CHEAP,
                quality: EntryPoint.JobQuality.LOW,
                minReputation: 0
            })
        );

        (
            string memory jobId,
            address jobCreator,
            uint256 maxTokenAmount,
            uint256 createdAt,
            uint256 returnedDeadline,
            EntryPoint.JobPriority priority,
            EntryPoint.JobQuality quality,
            uint256 minReputation,
            EntryPoint.JobStatus status,
            EntryPoint.Bid memory bestBid,
            uint256 bestBidScore,
            uint256 bidCount
        ) = entryPoint.getJobDetails("job-1");

        assertEq(keccak256(bytes(jobId)), keccak256(bytes("job-1")));
        assertEq(jobCreator, creator);
        assertEq(maxTokenAmount, 300 ether);
        assertEq(createdAt, 1_700_000_000);
        assertEq(returnedDeadline, deadline);
        assertEq(uint256(priority), uint256(EntryPoint.JobPriority.CHEAP));
        assertEq(uint256(quality), uint256(EntryPoint.JobQuality.LOW));
        assertEq(minReputation, 0);
        assertEq(uint256(status), uint256(EntryPoint.JobStatus.PENDING));
        assertFalse(bestBid.exists);
        assertEq(bestBidScore, 0);
        assertEq(bidCount, 0);

        assertEq(vault.getBalance(creator), 200 ether);

        assertEq(token.balanceOf(address(escrow)), 300 ether);
    }

    function testFinalizeJobAndCompleteWithRefund() public {
        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-2",
                creator: creator,
                maxTokenAmount: 300 ether,
                deadline: block.timestamp + 1 days,
                createdAt: 1_700_000_100,
                priority: EntryPoint.JobPriority.CHEAP,
                quality: EntryPoint.JobQuality.LOW,
                minReputation: 0
            })
        );

        vm.prank(node);
        entryPoint.placeBid("bid-2", 200 ether, "job-2", 1_700_000_120, 1 days);

        vm.warp(block.timestamp + 2 days);
        entryPoint.finalizeJob("job-2");

        assertEq(entryPoint.getJobAssignee("job-2"), node);

        (, , , address payee, uint256 escrowAmount, bool settledBeforeRelease) = entryPoint.getEscrowDetails("job-2");
        assertEq(payee, node);
        assertEq(escrowAmount, 300 ether);
        assertFalse(settledBeforeRelease);

        vm.prank(coordinator);
        entryPoint.markJobAsCompleted("job-2");

        assertEq(token.balanceOf(node), 200 ether);
        assertEq(vault.getBalance(creator), 300 ether);

        (, , , , , bool settledAfterRelease) = entryPoint.getEscrowDetails("job-2");
        assertTrue(settledAfterRelease);
    }

    function testMarkJobAsFailedRefundsEscrow() public {
        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-3",
                creator: creator,
                maxTokenAmount: 250 ether,
                deadline: block.timestamp + 1 days,
                createdAt: 1_700_000_200,
                priority: EntryPoint.JobPriority.BALANCED,
                quality: EntryPoint.JobQuality.MEDIUM,
                minReputation: 0
            })
        );

        vm.prank(node);
        entryPoint.placeBid("bid-3", 180 ether, "job-3", 1_700_000_220, 1 days);

        vm.warp(block.timestamp + 2 days);
        entryPoint.finalizeJob("job-3");

        vm.prank(coordinator);
        entryPoint.markJobAsFailed("job-3");

        assertEq(vault.getBalance(creator), 500 ether);

        (, , , , , bool settledAfterRefund) = entryPoint.getEscrowDetails("job-3");
        assertTrue(settledAfterRefund);
    }

    function testMarkJobAsCompletedRevertsForNonCoordinator() public {
        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-4",
                creator: creator,
                maxTokenAmount: 100 ether,
                deadline: block.timestamp + 1 days,
                createdAt: 1_700_000_300,
                priority: EntryPoint.JobPriority.CHEAP,
                quality: EntryPoint.JobQuality.LOW,
                minReputation: 0
            })
        );

        vm.prank(node);
        entryPoint.placeBid("bid-4", 80 ether, "job-4", 1_700_000_320, 1 days);

        vm.warp(block.timestamp + 2 days);
        entryPoint.finalizeJob("job-4");

        vm.prank(outsider);
        vm.expectRevert("Only the coordinator can call this function");
        entryPoint.markJobAsCompleted("job-4");
    }

    function testCreateJobRevertsOnDuplicateJobId() public {
        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-5",
                creator: creator,
                maxTokenAmount: 50 ether,
                deadline: block.timestamp + 1 days,
                createdAt: 1_700_000_400,
                priority: EntryPoint.JobPriority.FAST,
                quality: EntryPoint.JobQuality.HIGH,
                minReputation: 0
            })
        );

        vm.expectRevert("Job ID already exists");
        entryPoint.createJob(
            EntryPoint.CreateJobParams({
                jobId: "job-5",
                creator: creator,
                maxTokenAmount: 50 ether,
                deadline: block.timestamp + 2 days,
                createdAt: 1_700_000_401,
                priority: EntryPoint.JobPriority.FAST,
                quality: EntryPoint.JobQuality.HIGH,
                minReputation: 0
            })
        );
    }
}
