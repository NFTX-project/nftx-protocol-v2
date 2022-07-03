// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "../util/ReentrancyGuardUpgradeable.sol";

import "hardhat/console.sol";


/**
 * @notice ..
 * 
 * @author Twade
 */

contract NFTXVaultCreationZap is ReentrancyGuardUpgradeable {

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable vaultFactory;


  /**
   * @notice Initialises our zap by setting contract addresses onto their
   * respective interfaces.
   * 
   * @param _vaultFactory NFTX Vault Factory contract address
   */

  constructor(address _vaultFactory) {
    vaultFactory = INFTXVaultFactory(_vaultFactory);
  }


  /**
   * @notice ..
   */

  function createVault(
    // Vault creation
    string memory name,
    string memory symbol,
    address assetAddress,
    bool is1155,
    bool allowAllItems,

    // Vault features
    bytes32 vaultFeatures,

    // Fee assignment
    bytes32 vaultFees,

    // Eligibility storage
    uint moduleIndex,
    bytes calldata initData

  ) external nonReentrant returns (address vaultAddress) {
    uint vaultId = vaultFactory.createVault(name, symbol, assetAddress, is1155, allowAllItems);

    if (vaultFeatures > 0) {
      setVaultFeatures(vaultId, vaultFeatures);
    }

    if (vaultFees > 0) {
      setVaultFees(vaultId, vaultFees);
    }

    vaultAddress = _getVaultAddress(vaultId);
    INFTXVault vault = INFTXVault(vaultAddress);

    if (moduleIndex > 0) {
      vault.deployEligibilityStorage(moduleIndex, initData);
    }

    // or 1155 (zap will have timelock exclusion)
    // mintAndStakeLiquidity721();

    vault.finalizeVault();
  }

  function setVaultFeatures(uint vaultId, bytes32 vaultFeatures) internal {
    bool _enableMint = bool(bytes1(vaultFeatures) == 0x01);
    bool _enableRandomRedeem = bool(bytes1(vaultFeatures << 8) == 0x01);
    bool _enableTargetRedeem = bool(bytes1(vaultFeatures << 16) == 0x01);
    bool _enableRandomSwap = bool(bytes1(vaultFeatures << 24) == 0x01);
    bool _enableTargetSwap = bool(bytes1(vaultFeatures << 32) == 0x01);

    INFTXVault(_getVaultAddress(vaultId)).setVaultFeatures(
      _enableMint,
      _enableRandomRedeem,
      _enableTargetRedeem,
      _enableRandomSwap,
      _enableTargetSwap
    );
  }

  function setVaultFees(uint vaultId, bytes32 data) internal {
    // (mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee) = _unpack();

    // vaultFactory.setVaultFees(vaultId, mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee);
  }

  function mintAndStakeLiquidity721() internal {
    //
  }

  function _getVaultAddress(uint vaultId) internal returns (address) {
    return vaultFactory.vault(vaultId);
  }

}
