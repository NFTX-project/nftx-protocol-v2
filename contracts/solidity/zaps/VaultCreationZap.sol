// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "../token/IERC1155Upgradeable.sol";
import "../util/ReentrancyGuardUpgradeable.sol";


/**
 * @notice An amalgomation of vault creation steps, merged and optimised in
 * a single contract call in an attempt reduce gas costs to the end-user.
 * 
 * @author Twade
 */

contract NFTXVaultCreationZap is ReentrancyGuardUpgradeable {

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable vaultFactory;

  /// @notice Basic information pertaining to the vault
  struct vaultInfo {
    address assetAddress;      // 20/32
    bool is1155;               // 21/32
    bool allowAllItems;        // 22/32
    string name;               // ??/32
    string symbol;             // ??/32
  }

  /// @notice Fee information in 9-decimal format
  struct vaultFeesConfig {
    uint32 mintFee;
    uint32 randomRedeemFee;
    uint32 targetRedeemFee;
    uint32 randomSwapFee;
    uint32 targetSwapFee;
  }

  /// @notice Reference to the vault's eligibility implementation
  struct vaultEligibilityStorage {
    uint moduleIndex;
    bytes initData;
  }

  /// @notice Valid tokens to be transferred to the vault on creation
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
   * @notice Creates an NFTX vault, handling any desired settings and tokens.
   * 
   * @dev Tokens are deposited into the vault prior to fees being sent.
   * 
   * @param vaultData Basic information about the vault stored in `vaultInfo` struct
   * @param vaultFeatures A numeric representation of boolean values for features on the vault
   * @param vaultFees Fee definitions stored in a `vaultFeesConfig` struct
   * @param eligibilityStorage Eligibility implementation, stored in a `vaultEligibilityStorage` struct
   * @param assetTokens Tokens to be transferred to the vault in exchange for vault tokens
   * 
   * @return vaultId_ The numeric ID of the NFTX vault
   */

  function createVault(
    vaultInfo calldata vaultData,
    uint vaultFeatures,
    vaultFeesConfig calldata vaultFees,
    vaultEligibilityStorage calldata eligibilityStorage,
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

    // Mint and stake liquidity into the vault
    uint length = assetTokens.assetTokenIds.length;

    // If we don't have any tokens to send, we can skip our transfers
    if (length > 0) {
      // Determine the token type to alternate our transfer logic
      if (!vaultData.is1155) {
        // Iterate over our 721 tokens to transfer them all to our vault
        for (uint i; i < length;) {
          _transferFromERC721(vaultData.assetAddress, assetTokens.assetTokenIds[i], address(vault));
          unchecked { ++i; }
        }
      } else {
        // Transfer all of our 1155 tokens to the vault
        IERC1155Upgradeable(vaultData.assetAddress).safeBatchTransferFrom(
          msg.sender,
          address(vault),
          assetTokens.assetTokenIds,
          assetTokens.assetTokenAmounts,
          ""
        );
      }

      // We can now mint our asset tokens, giving the vault our tokens
      vault.mintTo(assetTokens.assetTokenIds, assetTokens.assetTokenAmounts, msg.sender);
    }

    // Set our vault fees, converting our 9-decimal to 18-decimal
    vault.setFees(
      uint256(vaultFees.mintFee) * 10e9,
      uint256(vaultFees.randomRedeemFee) * 10e9,
      uint256(vaultFees.targetRedeemFee) * 10e9,
      uint256(vaultFees.randomSwapFee) * 10e9,
      uint256(vaultFees.targetSwapFee) * 10e9
    );

    // If we have a specified eligibility storage, add that on
    if (eligibilityStorage.moduleIndex > 0) {
      vault.deployEligibilityStorage(
        eligibilityStorage.moduleIndex,
        eligibilityStorage.initData
      );
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
   * @notice Reads a boolean at a set character index of a uint.
   * 
   * @dev 0 and 1 define false and true respectively.
   * 
   * @param _packedBools A numeric representation of a series of boolean values
   * @param _boolNumber The character index of the boolean we are looking up
   *
   * @return bool The representation of the boolean value
   */

  function _getBoolean(uint256 _packedBools, uint256 _boolNumber) internal pure returns(bool) {
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }

}
