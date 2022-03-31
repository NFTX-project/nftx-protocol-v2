// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


interface INFTXVaultListing {

    function createListings(
        uint[] calldata nftIds,
        address[] calldata vaults,
        uint[] calldata prices,
        uint[] calldata amounts,
        uint[] calldata expiries
    ) external;

    function updateListings(
        uint[] calldata nftIds,
        address[] calldata vaults,
        uint[] calldata prices,
        uint[] calldata expiries
    ) external;

    function fillListings(
        uint[] calldata nftIds,
        address[] calldata vaults,
        uint[] calldata amounts
    ) external;

    function getListings(
        address[] calldata vaults
    ) external returns (uint[] memory);

}
