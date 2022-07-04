// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "../util/ReentrancyGuardUpgradeable.sol";


/**
 * @notice ..
 * 
 * @author Twade
 */

contract NFTXVaultCreationZap is ReentrancyGuardUpgradeable {

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable vaultFactory;

  struct vaultInfo {
    string name;               // ??/32
    string symbol;             // ??/32
    address assetAddress;      // 20/32
    bool is1155;               // 21/32
    bool allowAllItems;        // 22/32
  }

  struct vaultFeesConfig {
    uint32 mintFee;
    uint32 randomRedeemFee;
    uint32 targetRedeemFee;
    uint32 randomSwapFee;
    uint32 targetSwapFee;
  }

  struct vaultEligibilityStorage {
    uint moduleIndex;
    bytes initData;
  }

  struct vaultTokens {
    uint[] assetTokenIds;
    uint[] assetTokenAmounts;
  }


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
    vaultInfo calldata vaultData,

    // Vault features
    uint vaultFeatures,

    // Fee assignment
    vaultFeesConfig calldata vaultFees,

    // Eligibility storage
    vaultEligibilityStorage calldata eligibilityStorage,

    // Staking
    vaultTokens calldata assetTokens

  ) external nonReentrant returns (uint vaultId_) {
    // Create our vault skeleton
    vaultId_ = vaultFactory.createVault(
      vaultData.name,
      vaultData.symbol,
      vaultData.assetAddress,
      vaultData.is1155,
      vaultData.allowAllItems
    );

    // Build our vault interface
    INFTXVault vault = INFTXVault(vaultFactory.vault(vaultId_));

    // If we have specified vault features then update them
    if (vaultFeatures > 0) {
      vault.setVaultFeatures(
        _getBoolean(vaultFeatures, 0),
        _getBoolean(vaultFeatures, 1),
        _getBoolean(vaultFeatures, 2),
        _getBoolean(vaultFeatures, 3),
        _getBoolean(vaultFeatures, 4)
      );
    }

    // Set our vault fees
    vault.setFees(
      vaultFees.mintFee,
      vaultFees.randomRedeemFee,
      vaultFees.targetRedeemFee,
      vaultFees.randomSwapFee,
      vaultFees.targetSwapFee
    );

    // If we have a specified eligibility storage, add that on
    if (eligibilityStorage.moduleIndex > 0) {
      vault.deployEligibilityStorage(
        eligibilityStorage.moduleIndex,
        eligibilityStorage.initData
      );
    }

    // Mint and stake liquidity into the vault
    vault.mint(
      assetTokens.assetTokenIds,
      assetTokens.assetTokenAmounts
    );

    // Finalise our vault, preventing further edits
    vault.finalizeVault();
  }

  function _getBoolean(uint256 _packedBools, uint256 _boolNumber) internal returns(bool) {
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }

}
