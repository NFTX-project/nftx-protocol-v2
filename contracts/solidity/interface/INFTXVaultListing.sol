// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface INFTXVaultListing {

    function createListing(
        uint256 calldata nftId,
        address calldata vault,
        uint32 calldata price,
        uint24 calldata amount,
        uint32 calldata expiry
    ) external;

    function updateListing(
        uint256 calldata nftId,
        address calldata vault,
        bytes32 calldata listingId,
        uint32 calldata price,
        uint32 calldata expiry,
        uint24 calldata amount
    ) external;

    function fillListings(
        uint256[] calldata nftId,
        address[] calldata vault,
        bytes32[] calldata listingId,
        uint24[] calldata amount
    ) external;

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint32[] calldata prices,
        uint24[] calldata amounts,
        uint32[] calldata expiries
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
