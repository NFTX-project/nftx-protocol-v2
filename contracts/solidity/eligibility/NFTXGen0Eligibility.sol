// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXEligibility.sol";

interface KittyCore {
	function ownerOf(uint256 _tokenId) external view returns (address owner);

	function getKitty(uint256 _id)
		external
		view
		returns (
			bool,
			bool,
			uint256,
			uint256,
			uint256,
			uint256,
			uint256,
			uint256,
			uint256 _generation,
			uint256
		);
}

contract NFTXGen0KittyEligibility is NFTXEligibility {
	function name() public pure virtual override returns (string memory) {
		return "Gen0Kitty";
	}

	function finalized() public view virtual override returns (bool) {
		return true;
	}

	function targetAsset() public pure virtual override returns (address) {
		return 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
	}

	event NFTXEligibilityInit();

	function __NFTXEligibility_init_bytes(
		bytes memory /* configData */
	) public virtual override initializer {
		__NFTXEligibility_init();
	}

	/// @dev Parameters here should mirror the config struct.
	function __NFTXEligibility_init() public initializer {
		emit NFTXEligibilityInit();
	}

	function _checkIfEligible(uint256 _tokenId) internal view virtual override returns (bool) {
		(, , , , , , , , uint256 _generation, ) = KittyCore(targetAsset()).getKitty(_tokenId);
		return _generation == 0;
	}
}
