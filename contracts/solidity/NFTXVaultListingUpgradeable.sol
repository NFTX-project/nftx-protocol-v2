// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultListing.sol";
import "./testing/IERC721.sol";
import "./util/OwnableUpgradeable.sol";


// Authors: @tomwade.

/**
 * @dev Contract to allow listings to be created with a specified price
 * against an NFTX vault.
 */

contract NFTXVaultListingUpgradeable is INFTXVaultListing, OwnableUpgradeable {

    /**
     * @notice The structure of a listing.
     */

    struct Listing {
        uint id;
        uint vaultId;
        address vaultAddress;
        uint nftId;
        uint price;
        bool active;
        uint expiry;
        address seller;
    }

    // {ListingCreated} fired when a new listing is created
    event ListingCreated(uint256 listingId, uint256 nftId, address vault, uint256 price, uint256 expires);

    // {ListingUpdated} fired when an existing listing is updated
    event ListingUpdated(uint256 listingId, uint256 price, uint256 expires);

    // {ListingFilled} fired when an existing listing is successfully filled
    event ListingFilled(uint256 listingId);

    // Mapping of vaultAddress => nftId => listing.id
    mapping(address => mapping(uint => uint)) public listingMapping;

    // Flat store of all listings
    Listing[] public listings;

    // Stores listing IDs within a vault
    mapping(address => uint[]) listingVaultIds;

    // Stores the minimum floor price for new listings
    uint public minFloorPrice;


    /**
     * @notice Initialises the NFTX Vault Listing contract and sets a minimum
     * listing price.
     */

    function __NFTXVaultListing_init() public virtual initializer {
        __Ownable_init();
        minFloorPrice = 1200000000000000000;
    }


    /**
     * @notice Allows authorised users to set a new minimum listing price.
     *
     * @param _minFloorPrice New minimum listing price
     */

    function setFloorPrice(uint _minFloorPrice) external onlyOwner {
        minFloorPrice = _minFloorPrice;
    }


    /**
     * @notice Allows approved ERC721 NFTs to be listed against a vault. The NFT must
     * belong to the asset address stored against the NFTX vault and have an expiry
     * timestamp set in the future.
     *
     * @param nftIds The IDs of the NFTs being submitted
     * @param vaults The addresses of the NFTX vaults
     * @param prices Token price item will be listed at
     * @param expires The timestamp the listing will expire
     */

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint256[] calldata prices,
        uint256[] calldata expires
    ) external override {
        uint count = nftIds.length;
        require(count > 0);

        for (uint i; i < count;) {
            // Don't let the user create a listing that expires in the past
            require(expires[i] > block.timestamp, 'Listing already expired');

            // Sanity check our pricing is >= 1.2
            require(prices[i] >= minFloorPrice, 'Listing below floor price');

            // Ensure our sender actually owners the NFT they are wanting to list
            require(_senderOwnsNFT(msg.sender, vaults[i], nftIds[i]), 'Sender does not own NFT');

            // Ensure our sender has approved the NFT
            require(
                IERC721(INFTXVault(vaults[i]).assetAddress()).getApproved(nftIds[i]) == address(this),
                'Sender has not approved NFT'
            );

            _createListing(msg.sender, nftIds[i], vaults[i], prices[i], expires[i]);

            unchecked { ++i; }
        }
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds The IDs of the NFTs being updated
     * @param vaults The addresses of the NFTX vaults
     * @param expires The updated timestamp the listing will expire
     */

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint256[] calldata expires
    ) external override {
        uint count = nftIds.length;
        require(count > 0, 'No NFTs specified');

        for (uint i; i < count;) {
            // Confirm that our listing exists
            uint listingId = listingMapping[vaults[i]][nftIds[i]];
            require(_listingExists(listingId), 'Listing ID does not exist');

            Listing memory existingListing = listings[listingId];

            require(existingListing.active, 'Listing is not active');
            require(existingListing.seller == msg.sender, 'Sender is not listing owner');

            // Ensure our sender actually owners the NFT they are wanting to update
            require(_senderOwnsNFT(msg.sender, vaults[i], nftIds[i]), 'Sender does not own NFT');

            _updateListing(nftIds[i], vaults[i], expires[i]);

            unchecked { ++i; }
        }
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds The IDs of the NFTs being filled
     * @param vaults The addresses of the NFTX vaults
     */

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults
    ) external override {
        uint count = nftIds.length;
        require(count > 0);

        for (uint i; i < count;) {
            // Confirm that our listing exists
            uint listingId = listingMapping[vaults[i]][nftIds[i]];
            require(_listingExists(listingId), 'Listing ID does not exist');

            Listing storage existingListing = listings[listingId];

            // Confirm the listing is active
            require(existingListing.active, 'Listing is not active');

            // Confirm the buyer is not the seller
            require(existingListing.seller != msg.sender, 'Buyer cannot be seller');

            // Confirm the listing has not expired
            require(existingListing.expiry > block.timestamp, 'Listing has expired');

            _fillListing(msg.sender, nftIds[i], vaults[i]);

            unchecked { ++i; }
        }
    }


    /**
     * @notice Returns a list of listing IDs for all active listings that match the
     * user's requested vault addresses. If no vaults are specified then all active
     * listings will be returned through the `_getAllListings()` function.
     *
     * @param vaults Optional array of specific NFTX vaults to query
     */

    function getListings(address[] calldata vaults) external view returns (uint[] memory) {
        // If we have no vaults specified, we show results from all tracked listing vaults
        uint vaultsLength = vaults.length;
        if (vaultsLength == 0) {
            return this._getAllListings();
        }

        // Build a temporary listings array
        uint[] memory _tmpListingIds = new uint[](listings.length);
        uint counter = 0;

        // Loop through all of our requested vaults
        for (uint i; i < vaultsLength;) {
            address tmpVaultAddr = vaults[i];

            unchecked { ++i; }

            // Get the number of listings in the specified vault
            uint vaultListingsLength = listingVaultIds[tmpVaultAddr].length;

            // If we have an unknown vault, or a vault with no listings, then
            // we can skip them.
            if (vaultListingsLength == 0) {
                continue;
            }

            // Loop through listings in the vault
            for (uint j; j < vaultListingsLength;) {
                uint tmpListingId = listingVaultIds[tmpVaultAddr][j];

                unchecked { ++j; }

                // If the listing is active then we can add it to our response
                if (listings[tmpListingId].active) {
                    _tmpListingIds[counter] = listings[tmpListingId].id;
                    unchecked { ++counter; }
                }
            }
        }

        return _remapListings(_tmpListingIds, counter);
    }


    /**
     * @notice Returns all active listings from across all vaults.
     */

    function _getAllListings() external view returns (uint[] memory) {
        uint listingsLength = listings.length;

        // If we have no listings then return an empty array
        if (listingsLength == 0) {
            return new uint[](0);
        }

        // Set up our listings array with a length of all possible listings
        uint[] memory _listingIds = new uint[](listingsLength);
        uint counter = 0;

        // Loop through all of our listings
        for (uint i; i < listingsLength;) {
            // If the listing is active, then add it to our response
            if (listings[i].active) {
                _listingIds[counter] = listings[i].id;
                unchecked { ++counter; }
            }

            unchecked { ++i; }
        }

        return _remapListings(_listingIds, counter);
    }


    /**
     * @notice Acts as an alternative to array slice as it's not possible for us to perform
     * the shorthand [0:_counter] on a memory array. This allows us to strip unused space
     * from our memory array.
     *
     * @param _listingIds Over-sized memory array of listing IDs
     * @param _counter Number of results to return
     */

    function _remapListings(uint[] memory _listingIds, uint _counter) internal view returns (uint[] memory) {
        // Set up our listings array with a length of all possible listings
        uint[] memory listingIds = new uint[](_counter);

        // Loop through all of our listings
        for (uint i; i < _counter;) {
            listingIds[i] = _listingIds[i];
            unchecked { ++i; }
        }

        return listingIds;
    }


    /**
     * @notice Creates a listing object and updates our internal mappings.
     *
     * @param seller The address of the seller creating the listing
     * @param nftId The ERC721 NFT ID
     * @param vault The NFTX Vault address
     * @param price The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry The timestamp that the listing will expire
     */

    function _createListing(address seller, uint256 nftId, address vault, uint256 price, uint256 expiry) internal {
        // Create our listing object
        Listing memory listing = Listing(
            listings.length,                // id
            INFTXVault(vault).vaultId(),    // vaultId
            vault,                          // vaultAddress
            nftId,                          // nftId
            price,                          // price
            true,                           // active
            expiry,                         // expiry
            seller                          // seller
        );

        // Add our listing
        listings.push(listing);

        // Create our mapping
        listingMapping[vault][nftId] = listing.id;

        // Add our internal tracking
        listingVaultIds[vault].push(listing.id);

        emit ListingCreated(listing.id, listing.nftId, listing.vaultAddress, listing.price, listing.expiry);
    }


    /**
     * @notice Updates a listing object.
     *
     * @param nftId The ERC721 NFT ID
     * @param vault The NFTX Vault address
     * @param expiry The timestamp that the listing will expire
     */

    function _updateListing(uint256 nftId, address vault, uint256 expiry) internal {
        // Listing ID validity should already be validated
        uint listingId = listingMapping[vault][nftId];

        if (expiry == 0) {
            delete listingMapping[vault][nftId];
        }

        Listing storage listing = listings[listingId];

        // Set the listing to new expiry time, and if it is in the past then
        // we also set it to inactive
        listing.expiry = expiry;
        if (expiry < block.timestamp) {
            listing.active = false;
        }

        emit ListingUpdated(listing.id, listing.price, listing.expiry);
    }


    /**
     * @notice Fills a listing object and transfers the relevant tokens and NFTs.
     *
     * @param buyer The address of the user buying the NFT
     * @param nftId The ERC721 NFT ID
     * @param vault The NFTX Vault address
     */

    function _fillListing(address buyer, uint256 nftId, address vault) internal {
        uint listingId = listingMapping[vault][nftId];
        require(_listingExists(listingId), 'Listing ID does not exist');

        // Reference our listing
        Listing storage listing = listings[listingId];

        // Get our vault reference
        INFTXVault nftxVault = INFTXVault(vault);

        // Send the seller tokens from the buyer
        nftxVault.transferFrom(buyer, listing.seller, listing.price);

        // Send NFT to buyer
        IERC721(nftxVault.assetAddress()).transferFrom(listing.seller, buyer, nftId);

        // Deactivate the listing by setting expiry time to 0
        _updateListing(nftId, vault, 0);

        emit ListingFilled(listing.id);
    }


    /**
     * @notice Checks that a user owns the NFT specified.
     *
     * @param from The address of the user
     * @param vault The NFTX Vault address
     * @param nftId The ERC721 NFT ID
     */

    function _senderOwnsNFT(address from, address vault, uint nftId) internal returns (bool) {
        return IERC721(INFTXVault(vault).assetAddress()).ownerOf(nftId) == from;
    }


    /**
     * @notice Checks that a listing existst from our mapping.
     *
     * @param listingId The ID of the listing being queried
     */

    function _listingExists(uint listingId) internal returns (bool) {
        return listingId >= 0;
    }

}
