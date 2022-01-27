// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXUniqueEligibility.sol";

contract NFTXDenyEligibility is NFTXUniqueEligibility {
	function name() public pure virtual override returns (string memory) {
		return "Deny";
	}

	function _checkIfEligible(uint256 _tokenId) internal view virtual override returns (bool) {
		return !isUniqueEligible(_tokenId);
	}

	function afterRedeemHook(uint256[] calldata tokenIds) external virtual override {
		require(msg.sender == vault);
		if (negateEligOnRedeem) {
			// Reversing eligibility to true here so they're added to the deny list.
			_setUniqueEligibilities(tokenIds, true);
		}
	}
}
