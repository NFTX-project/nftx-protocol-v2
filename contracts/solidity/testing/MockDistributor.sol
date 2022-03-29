// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// Author: 0xKiwi.

import "../token/IERC20Upgradeable.sol";
import "../util/OwnableUpgradeable.sol";

contract MockDistributor is OwnableUpgradeable {

  address public nftxVaultFactory;
  address public inventoryStaking;

  function __MockDistributor_init() external {
    __Ownable_init();
  }

  function distribute(uint256 vaultId) external {
  }

  function initializeVaultReceivers(uint256 vaultId) external {
    
  }

  function setNFTXVaultFactory(address _factory) external onlyOwner {
    require(address(nftxVaultFactory) == address(0), "nftxVaultFactory is immutable");
    nftxVaultFactory = _factory;
  }

  function setInventoryStakingAddress(address _inventoryStaking) public onlyOwner {
    inventoryStaking = _inventoryStaking;
  }

  function withdrawTokens(address token) external onlyOwner {
    uint256 bal = IERC20Upgradeable(token).balanceOf(address(this));
    IERC20Upgradeable(token).transfer(msg.sender, bal);
  }
}