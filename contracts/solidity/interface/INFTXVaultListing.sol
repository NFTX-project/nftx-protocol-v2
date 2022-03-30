// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface INFTXVaultListing {

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint256[] calldata prices,
        uint256[] calldata expiries
    ) external;

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint256[] calldata expiries
    ) external;

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults
    ) external;

    function getListings(
        address[] calldata vaults
    ) external;

}
