// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "../token/IERC1155Upgradeable.sol";
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
    uint length = assetTokens.assetTokenIds.length;
    if (length > 0) {
      if (!vaultData.is1155) {
        for (uint i; i < length;) {
          _transferFromERC721(vaultData.assetAddress, assetTokens.assetTokenIds[i], address(vault));
          unchecked { ++i; }
        }
      } else {
        // This is technically a check, so placing it before the effect.
        IERC1155Upgradeable(vaultData.assetAddress).safeBatchTransferFrom(
          msg.sender,
          address(this),
          assetTokens.assetTokenIds,
          assetTokens.assetTokenAmounts,
          ""
        );
      }

      // We can now mint our asset tokens, giving the vault our tokens
      vault.mintTo(assetTokens.assetTokenIds, assetTokens.assetTokenAmounts, msg.sender);
    }

    // Finalise our vault, preventing further edits
    vault.finalizeVault();
  }


  /**
   * @notice Transfers our ERC721 tokens to a specified recipient.
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function _transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    bytes memory data;

    if (assetAddr == 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB) {
      // Fix here for frontrun attack.
      bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", tokenId);
      (bool checkSuccess, bytes memory result) = address(assetAddr).staticcall(punkIndexToAddress);
      (address nftOwner) = abi.decode(result, (address));
      require(checkSuccess && nftOwner == msg.sender, "Not the NFT owner");
      data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
    } else {
      // We push to the vault to avoid an unneeded transfer.
      data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", msg.sender, to, tokenId);
    }

    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }


  /**
   * @notice ..
   * 
   * @param _packedBools ..
   * @param _boolNumber ..
   *
   * @return ..
   */

  function _getBoolean(uint256 _packedBools, uint256 _boolNumber) internal pure returns(bool) {
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }

}
