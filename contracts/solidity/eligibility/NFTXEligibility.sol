// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../proxy/Initializable.sol";
import "../interface/INFTXEligibility.sol";

/// @notice This is a contract meant to be inherited and overriden to implement eligibility modules.
abstract contract NFTXEligibility is INFTXEligibility, Initializable {
	function name() public pure virtual override returns (string memory);

	function finalized() public view virtual override returns (bool);

	function targetAsset() public pure virtual override returns (address);

	function __NFTXEligibility_init_bytes(bytes memory initData) public virtual override;

	function checkIsEligible(uint256 tokenId) external view virtual override returns (bool) {
		return _checkIfEligible(tokenId);
	}

	function checkEligible(uint256[] calldata tokenIds) external view virtual override returns (bool[] memory) {
		uint256 length = tokenIds.length;
		bool[] memory eligibile = new bool[](length);
		for (uint256 i; i < length; i++) {
			eligibile[i] = _checkIfEligible(tokenIds[i]);
		}
		return eligibile;
	}

	function checkAllEligible(uint256[] calldata tokenIds) external view virtual override returns (bool) {
		uint256 length = tokenIds.length;
		for (uint256 i; i < length; i++) {
			// If any are not eligible, end the loop and return false.
			if (!_checkIfEligible(tokenIds[i])) {
				return false;
			}
		}
		return true;
	}

	/// @notice Checks if all provided NFTs are NOT eligible. This is needed for mint requesting where all NFTs
	/// provided must be ineligible.
	function checkAllIneligible(uint256[] calldata tokenIds) external view virtual override returns (bool) {
		uint256 length = tokenIds.length;
		for (uint256 i; i < length; i++) {
			// If any are eligible, end the loop and return false.
			if (_checkIfEligible(tokenIds[i])) {
				return false;
			}
		}
		return true;
	}

	function beforeMintHook(uint256[] calldata tokenIds) external virtual override {}

	function afterMintHook(uint256[] calldata tokenIds) external virtual override {}

	function beforeRedeemHook(uint256[] calldata tokenIds) external virtual override {}

	function afterRedeemHook(uint256[] calldata tokenIds) external virtual override {}

	/// @dev Override this to implement your module!
	function _checkIfEligible(uint256 _tokenId) internal view virtual returns (bool);
}
