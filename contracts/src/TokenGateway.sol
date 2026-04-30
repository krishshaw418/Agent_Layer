// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IAGLToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
}

contract AGLGateway is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IAGLToken public immutable agl;

    uint256 public tokensPerUSDC; // 500_000 for now

    uint256 public constant USDC_DECIMALS = 1e6;

    address public deployer;

    event Deposited(address indexed user, uint256 usdcAmount, uint256 aglMinted);
    event Withdrawn(address indexed user, uint256 aglBurned, uint256 usdcReturned);
    event TokensPerUSDCUpdated(uint256 newRate);

    constructor(address _usdc, address _agl, uint256 _tokensPerUSDC, address _deployer) {
        require(_usdc != address(0), "Invalid USDC");
        require(_agl != address(0), "Invalid AGL");
        require(_tokensPerUSDC > 0, "Invalid rate");

        usdc = IERC20(_usdc);
        agl = IAGLToken(_agl);
        tokensPerUSDC = _tokensPerUSDC;
        deployer = _deployer;
    }

    modifier onlyDeployer() {
        _onlyDeployer();
        _;
    }
 
    function _onlyDeployer() internal view {
        require(msg.sender == deployer, "Only the deployer can call this function");
    }

    function deposit(uint256 usdcAmount) external nonReentrant {
        require(usdcAmount > 0, "Amount = 0");
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        uint256 aglAmount = (usdcAmount * tokensPerUSDC) / USDC_DECIMALS;

        require(aglAmount > 0, "Too small");

        // Mint AGL to user
        agl.mint(msg.sender, aglAmount);

        emit Deposited(msg.sender, usdcAmount, aglAmount);
    }

    function withdraw(uint256 aglAmount) external nonReentrant {
        require(aglAmount > 0, "Amount = 0");


        uint256 usdcAmount = (aglAmount * USDC_DECIMALS) / tokensPerUSDC;

        require(usdcAmount > 0, "Too small");

        agl.burn(msg.sender, aglAmount);
        usdc.safeTransfer(msg.sender, usdcAmount);

        emit Withdrawn(msg.sender, aglAmount, usdcAmount);
    }

    function getTokensPerUSDC() external view returns (uint256) {
        return tokensPerUSDC;
    }

    function setTokensPerUSDC(uint256 newRate) external onlyDeployer {
        require(newRate > 0, "Invalid rate");
        tokensPerUSDC = newRate;

        emit TokensPerUSDCUpdated(newRate);
    }

    function withdrawUSDC(address to, uint256 amount) external onlyDeployer {
        require(to != address(0), "Invalid address");
        usdc.safeTransfer(to, amount);
    }
}