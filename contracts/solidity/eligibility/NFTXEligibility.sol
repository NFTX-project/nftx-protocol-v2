// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/Initializable.sol";
import "../interface/INFTXEligibility.sol";


/**
 * @title NFTX Eligibility Manager
 * @author The NFTX Team
 * 
 * @notice This is a contract is intended to be inherited and overriden when creating
 * an eligibility module. The functions outlined will be called throughout the NFTX
 * vault journey and this abstract contract provides a number of helper functions.
 */

abstract contract NFTXEligibility is INFTXEligibility, Initializable {

  /**
   * @notice Defines the constant name of the eligibility module.
   *
   * @dev Try to keep the naming convention of the eligibility module short, but
   * desciptive as this will be displayed to end users looking to implement it.
   * 
   * @return The name of the eligibility module
   */

  function name() public pure override virtual returns (string memory);


  /**
   * @notice If the eligibility has been finalized then it can no longer be updated,
   * meaning the processing logic can no longer be modified and it is safe to use.
   * 
   * @return If the eligibility module is finalized
   */

  function finalized() public view override virtual returns (bool);


  /**
   * @notice Allows the module to define an asset that is targetted. This can be
   * subsequently used for internal calls to reference the token address being
   * queried.
   * 
   * @dev This is not a required field, and can just return `address(0)` if no
   * subsequent use is needed.
   * 
   * @return The address of the asset being referenced by the module
   */

  function targetAsset() public pure override virtual returns (address);
  

  /**
   * @notice Called when initialising the eligibility module, allowing configuring data
   * to be passed and initial module contract setup to be performed.
   * 
   * @dev If no further configuration is required, then we can just omit providing the
   * bytes with an attribute name and ignore any calculation.
   * 
   * @param initData This allows for abi encoded bytes to be decoded when initialised
   * and allow the module implementation to vary based on the vault's requirements.
   */

  function __NFTXEligibility_init_bytes(bytes memory initData) public override virtual;


  /**
   * @notice Checks if a tokenId is eligible to be received by the vault.
   * 
   * @param tokenId A tokenId to check the eligibility of
   * 
   * @return True if the tokenId is eligible to be received by the module's logic for the
   * vault, and False if it is not.
   */

  function checkIsEligible(uint256 tokenId) external view override virtual returns (bool) {
      return _checkIfEligible(tokenId);
  }


  /**
   * @notice Checks if an array of tokenIds are eligible to be received by the vault.
   * 
   * @param tokenIds An array of tokenIds to check the eligibility of
   * 
   * @return True if the tokenId is eligible to be received by the module's logic for the
   * vault, and False if it is not. The array of booleans will follow the same order as
   * the tokenIds were passed.
   */

  function checkEligible(uint256[] calldata tokenIds) external override virtual view returns (bool[] memory) {
      uint256 length = tokenIds.length;
      bool[] memory eligibile = new bool[](length);
      for (uint256 i; i < length; i++) {
          eligibile[i] = _checkIfEligible(tokenIds[i]);
      }
      return eligibile;
  }


  /**
   * @notice Checks if all tokenIds in an array are eligible to be received by the vault.
   * 
   * @param tokenIds An array of tokenIds to check the eligibility of
   * 
   * @return True if _all_ tokenIds are eligible to be received by the module's logic for the
   * vault, and False if any are not.
   */

  function checkAllEligible(uint256[] calldata tokenIds) external override virtual view returns (bool) {
      uint256 length = tokenIds.length;
      for (uint256 i; i < length; i++) {
          // If any are not eligible, end the loop and return false.
          if (!_checkIfEligible(tokenIds[i])) {
              return false;
          }
      }
      return true;
  }


  /**
   * @notice Checks if all provided NFTs are NOT eligible. This is needed for mint requesting
   * where all NFTs provided must be ineligible.
   * 
   * @param tokenIds An array of tokenIds to check the eligibility of
   * 
   * @return True if _none_ tokenIds are eligible to be received by the module's logic for the
   * vault, and False if any are.
   */

  function checkAllIneligible(uint256[] calldata tokenIds) external override virtual view returns (bool) {
      uint256 length = tokenIds.length;
      for (uint256 i; i < length; i++) {
          // If any are eligible, end the loop and return false.
          if (_checkIfEligible(tokenIds[i])) {
              return false;
          }
      }
      return true;
  }


  /**
   * @notice Called before tokenIds are minted into the NFTX vault.
   * 
   * @dev This function is not currently implemented in the NFTX Vault.
   * 
   * @param tokenIds An array of tokenIds
   */

  function beforeMintHook(uint256[] calldata tokenIds) external override virtual {}


  /**
   * @notice Called after tokenIds have been minted into the NFTX vault.
   * 
   * @dev This function is not currently implemented in the NFTX Vault.
   * 
   * @param tokenIds An array of tokenIds
   */

  function afterMintHook(uint256[] calldata tokenIds) external override virtual {}


  /**
   * @notice Called before tokenIds are redeemed from the NFTX vault.
   * 
   * @dev This function is not currently implemented in the NFTX Vault.
   * 
   * @param tokenIds An array of tokenIds
   */

  function beforeRedeemHook(uint256[] calldata tokenIds) external override virtual {}


  /**
   * @notice Called after tokenIds are redeemed from the NFTX vault.
   * 
   * @param tokenIds An array of tokenIds
   */

  function afterRedeemHook(uint256[] calldata tokenIds) external override virtual {}


  /**
   * @notice Contains logic to determine if a tokenId is eligible to be handled by the
   * NFTX vault.
   * 
   * @dev This is the minimum required logic to be processed in order to create a
   * functioning eligibility module.
   * 
   * @param _tokenId A tokenId to check the eligibility of
   * 
   * @return A boolean representation of the eligibility of the tokenId
   */

  function _checkIfEligible(uint256 _tokenId) internal view virtual returns (bool);
}
