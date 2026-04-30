// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract AgentLayerToken is ERC20 {
    address public gateway;
    address public deployer;

    constructor(uint256 initialSupply) ERC20("AgentLayer Token", "AGL") {
        deployer = msg.sender;
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Only the gateway can call this function");
        _;
    }

    modifier onlyDeployer() {
        _onlyDeployer();
        _;
    }
 
    function _onlyDeployer() internal view {
        require(msg.sender == deployer, "Only the deployer can call this function");
    }

    function setGateway(address _gateway) external onlyDeployer {
        require(_gateway != address(0), "Invalid gateway address");
        gateway = _gateway;
    }

    function mint(address to, uint256 amount) external onlyGateway {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyGateway {
        _burn(from, amount);
    }
}