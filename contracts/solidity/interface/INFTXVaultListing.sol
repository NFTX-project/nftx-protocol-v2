// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface INFTXVaultListing {

    function createListing(
        uint256 nftId,
        address vault,
        uint32 price,
        uint24 amount,
        uint32 expiry,
        uint8 royaltyFee,
        address paymentAsset
    ) external;

    function updateListing(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint32 price,
        uint32 expiry,
        uint24 amount
    ) external;

    function fillListing(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint24 amount
    ) external;

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint32[] calldata prices,
        uint24[] calldata amounts,
        uint32[] calldata expiries,
        uint8[] calldata royaltyFees,
        address[] calldata paymentAssets
    ) external;

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        bytes32[] calldata listingIds,
        uint32[] calldata prices,
        uint32[] calldata expiries,
        uint24[] calldata amounts
    ) external;

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        bytes32[] calldata listingIds,
        uint24[] calldata amounts
    ) external;

}
