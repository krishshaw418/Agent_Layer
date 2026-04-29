// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IVault} from "./Vault.sol";

using SafeERC20 for IERC20;

interface IEscrow {
    function createEscrow(string memory _jobId, string memory _bidId, address _payer, address _payee, uint256 _amount) external;
    function setPayee(string memory _jobId, address _payee) external;
    function releaseFunds(string memory _jobId, uint256 _amount) external;
    function refund(string memory _jobId) external;
    function getEscrowDetails(string memory _jobId) external view returns (string memory, string memory, address, address, uint256, bool);
}

contract Escrow is IEscrow, ReentrancyGuard {
    IERC20 public token;
    IVault public vault;
    address public entryPoint;
    address public deployer;

    struct EscrowData {
        string jobId;
        string bidId;
        address payer;
        address payee;
        uint256 amount;
        bool settled;
        bool exists;
    }

    mapping(bytes32 => EscrowData) public escrowData;

    constructor(address _token, address _deployer) {
        require(_token != address(0), "Invalid token");
        require(_deployer != address(0), "Invalid deployer address");

        token = IERC20(_token);
        deployer = _deployer;
    }

    modifier onlyEntryPoint() {
        _onlyEntryPoint();
        _;
    }
 
    function _onlyEntryPoint() internal view {
        require(msg.sender == entryPoint, "Only the EntryPoint contract can call this function");
    }

    modifier onlyDeployer() {
        _onlyDeployer();
        _;
    }
 
    function _onlyDeployer() internal view {
        require(msg.sender == deployer, "Only the deployer can call this function");
    }

    function setEntryPointAddress (address _entrypoint) public onlyDeployer {
        require(_entrypoint != address(0), "Invalid entry point");
        entryPoint = _entrypoint;
    }

    function setVaultAddress(address _vault) public onlyDeployer {
        require(_vault != address(0), "Invalid vault");
        vault = IVault(_vault);
    }

    function _hashString(string memory _str) internal pure returns (bytes32) {
        bytes32 result;
        assembly {
            result := keccak256(add(_str, 0x20), mload(_str))
        }
        return result;
    }

    function createEscrow(string memory _jobId, string memory _bidId, address _payer, address _payee, uint256 _amount) public onlyEntryPoint {
        require(_payer != address(0), "Invalid payer");
        require(_amount > 0, "Amount must be > 0");
        bytes32 jobKey = _hashString(_jobId);
        require(escrowData[jobKey].exists == false, "Escrow for this job already exists");

        escrowData[jobKey] = EscrowData({
            jobId: _jobId,
            bidId: _bidId,
            payer: _payer,
            payee: _payee,
            amount: _amount,
            settled: false,
            exists: true
        });
    }

    function setPayee(string memory _jobId, address _payee) external onlyEntryPoint {
        bytes32 jobKey = _hashString(_jobId);
        EscrowData storage data = escrowData[jobKey];

        require(data.exists, "Escrow does not exist");
        require(!data.settled, "Already settled");
        require(data.payee == address(0), "Payee already set");

        data.payee = _payee;
    }

    function releaseFunds(string memory _jobId, uint256 _amount) public onlyEntryPoint nonReentrant {
        bytes32 jobKey = _hashString(_jobId);
        EscrowData storage data = escrowData[jobKey];

        require(data.exists, "Escrow does not exist");
        require(!data.settled, "Already settled");
        require(_amount <= data.amount, "Exceeds escrowed amount");
        require(data.payee != address(0), "Payee not set");

        data.settled = true;

        uint256 refundAmount = data.amount - _amount;

        // Pay payee from escrow
        token.safeTransfer(data.payee, _amount);

        if (refundAmount > 0) {
            token.approve(address(vault), refundAmount);
            vault.depositFor(data.payer, refundAmount);
        }

    }

    function refund(string memory _jobId) public onlyEntryPoint nonReentrant {
        bytes32 jobKey = _hashString(_jobId);
        EscrowData storage data = escrowData[jobKey];

        require(data.exists, "Escrow does not exist");
        require(!data.settled, "Already settled");

        data.settled = true;

        token.approve(address(vault), data.amount);
        vault.depositFor(data.payer, data.amount);
    }

    function getEscrowDetails(string memory _jobId) public view returns (string memory, string memory, address, address, uint256, bool) {
        bytes32 jobKey = _hashString(_jobId);
        require(escrowData[jobKey].exists == true, "Escrow for this job does not exist");
        EscrowData memory data = escrowData[jobKey];
        return (data.jobId, data.bidId, data.payer, data.payee, data.amount, data.settled);
    }
}