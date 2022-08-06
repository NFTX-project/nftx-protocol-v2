// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./INFTXVaultFactory.sol";

// Author: 0xKiwi.

interface INFTXUniV3Staking {
    function defaultPair() external view returns (address);
    function positionsCreated() external view returns (uint256);
    function v3Factory() external view returns (address);
    function nftxVaultFactory() external view returns (INFTXVaultFactory);

    event PositionCreated(uint256 vaultId, uint256 tokenId, address sender);
    event Deposit(uint256 vaultId, uint256 tokenId, uint256 liquidityAmount, uint256 timelockUntil, address sender);
    event Withdraw(uint256 vaultId, uint256 tokenId, uint256 liquidityAmount, address sender);
    event FeesReceived(uint256 vaultId, uint256 amount);
    event ProtocolFeesReceived(uint256 vaultId, uint256 amount);
    event TradingFeesReceived(uint256 vaultId, uint256 amount);
    event FeesClaimed(uint256 vaultId, uint256 tokenId, uint256 amount, address sender);

    function __NFTXUniV3Staking_init(address _v3Factory, address _nftManager, address _defaultPair, address _nftxVaultFactory) external;

    function initializeUniV3Position(uint256 vaultId, uint160 sqrtPrice, uint256 amount0, uint256 amount1) external returns (uint256);

    function createStakingPositionNFT(uint256 vaultId, uint256 amount0, uint256 amount1) external returns (uint256);

    function addLiquidityToStakingPositionNFT(uint256 tokenId, uint256 amount0, uint256 amount1) external returns (uint256);

    function removeLiquidityFromVaultV3Position(uint256 tokenId, uint128 liquidityToRemove, uint128 amount0Max, uint128 amount1Max) external;

    function timelockNFT(uint256 tokenId, uint256 timelockDuration) external;

    function claimRewardsTo(uint256 tokenId, address receiver) external;

    function receiveRewards(uint256 vaultId, uint256 amount) external returns (bool);
}
