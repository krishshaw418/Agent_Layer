// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

using SafeERC20 for IERC20;

interface IVault {
    function rechargeVault(uint256 _amount) external;
    function depositFor(address _for, uint256 _amount) external;
    function getBalance(address _of) external view returns (uint256);
    function transfer(address _from, address _to, uint256 _amount) external;
    function addEntryPoint(address _entryPoint) external;
}

contract Vault {
    mapping (address => uint256) balances;
    address escrow;
    address entryPoint;
    address deployer;

    IERC20 public token;

    constructor(IERC20 _token, address _deployer) {
        token = _token;
        deployer = _deployer;
    }

    modifier onlyEScrowOrEntryPoint() {
        _onlyEScrowOrEntryPoint();
        _;
    }
 
    function _onlyEScrowOrEntryPoint() internal view {
        require(msg.sender == escrow || msg.sender == entryPoint, "Only the escrow or entry point can call this function");
    }

    modifier onlyDeployer() {
        _onlyDeployer();
        _;
    }
 
    function _onlyDeployer() internal view {
        require(msg.sender == deployer, "Only the deployer can call this function");
    }

    function rechargeVault(uint256 _amount) public {
        require(_amount > 0, "Invalid recharge amount");

        token.safeTransferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
    }

    function depositFor(address _for, uint256 _amount) public onlyEScrowOrEntryPoint {
        require(_amount > 0, "Invalid deposit amount");
        require(_for != address(0), "Invalid user address");

        token.safeTransferFrom(msg.sender, address(this), _amount);
        balances[_for] += _amount;
    }

    function getBalance(address _of) public view returns (uint256) {
        return balances[_of];
    }
    
    function transfer(address _from, address _to, uint256 _amount) public onlyEScrowOrEntryPoint {
        require(_amount > 0, "Invalid transfer amount");
        require(_amount <= balances[_from], "Insufficient balance to transfer");
        require(_to != address(0), "Invalid address to transfer");
        require(_from != address(0), "Invalid address to transfer");

        token.safeTransfer(_to, _amount);
        balances[_from] -= _amount;
    }

    function addEScrow(address _escrow) public onlyDeployer {
        require(_escrow != address(0), "Invalid escrow address");
        escrow = _escrow;
    }

    function addEntryPoint(address _entryPoint) public onlyDeployer {
        require(_entryPoint != address(0), "Invalid entry point address");
        entryPoint = _entryPoint;
    }
}
