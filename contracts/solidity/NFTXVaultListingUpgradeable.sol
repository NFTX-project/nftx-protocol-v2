// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXVaultListing.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./testing/IERC721.sol";
import "./util/ReentrancyGuardUpgradeable.sol";

import "hardhat/console.sol";

// Authors: @tomwade.

contract NFTXVaultListingUpgradeable is ReentrancyGuardUpgradeable, INFTXVaultListing {

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

    event ListingCreated();
    event ListingUpdated();
    event ListingFilled();

    // listings[vaultAddress][nftId] => listing.id index
    mapping(address => mapping(uint => uint)) public listingMapping;

    // Flat store of all listings
    Listing[] public listings;

    // Listing vaults
    mapping(address => uint[]) listingVaultIds;

    uint public minFloorPrice;

    INFTXVaultFactory vaultFactory;

    function __NFTXVaultListing_init(address _vaultFactory) public virtual initializer {
        vaultFactory = INFTXVaultFactory(_vaultFactory);
        minFloorPrice = 1200000000000000000;
    }

    // TODO: Need floor access
    function setFloorPrice(uint _minFloorPrice) external {
        minFloorPrice = _minFloorPrice;
    }

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

            emit ListingCreated();

            unchecked { ++i; }
        }
    }

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint256[] calldata expires
    ) external override {
        uint count = nftIds.length;
        require(count > 0, 'No NFTs specified');

        for (uint i; i < count;) {
            uint listingId = listingMapping[vaults[i]][nftIds[i]];
            require(_listingExists(listingId), 'Listing ID does not exist');

            Listing memory existingListing = listings[listingId];

            require(existingListing.active, 'Listing is not active');
            require(existingListing.seller == msg.sender, 'Sender is not listing owner');

            // Ensure our sender actually owners the NFT they are wanting to update
            require(_senderOwnsNFT(msg.sender, vaults[i], nftIds[i]), 'Sender does not own NFT');

            _updateListing(nftIds[i], vaults[i], expires[i]);

            emit ListingUpdated();

            unchecked { ++i; }
        }
    }

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults
    ) external override {
        uint count = nftIds.length;
        require(count > 0);

        for (uint i; i < count;) {
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

            emit ListingFilled();

            unchecked { ++i; }
        }
    }

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

    function _createListing(address seller, uint256 nftId, address vault, uint256 price, uint256 expiry) internal {
        // Create our listing object
        Listing memory listing = Listing(
            listings.length,        // id
            _getVaultId(vault),     // vaultId
            vault,                  // vaultAddress
            nftId,                  // nftId
            price,                  // price
            true,                   // active
            expiry,                 // expiry
            seller                  // seller
        );

        // Add our listing
        listings.push(listing);

        // Create our mapping
        listingMapping[vault][nftId] = listing.id;

        // Add our internal tracking
        listingVaultIds[vault].push(listing.id);
    }

    function _updateListing(uint256 nftId, address vault, uint256 expiry) internal {
        // Listing ID validity should already be validated
        uint listingId = listingMapping[vault][nftId];

        if (expiry == 0) {
            delete listingMapping[vault][nftId];
        }

        Listing storage listing = listings[listingId];

        listing.expiry = expiry;
        if (expiry < block.timestamp) {
            listing.active = false;
        }
    }

    function _fillListing(address buyer, uint256 nftId, address vault) internal {
        uint listingId = listingMapping[vault][nftId];
        require(_listingExists(listingId), 'Listing ID does not exist');

        // Reference our listing
        Listing storage listing = listings[listingId];

        // Get our vault reference
        INFTXVault nftxVault = INFTXVault(vault);

        nftxVault.transferFrom(buyer, listing.seller, listing.price);

        // Send NFT to buyer
        IERC721(nftxVault.assetAddress()).transferFrom(listing.seller, buyer, nftId);

        // Deactivate the listing by setting expiry time to 0
        _updateListing(nftId, vault, 0);

        /**
         *  CAP$ SEZ:
         * 
         *  We don't need to look at fees and the marketplace zap will essentially let
         *  people do the trade up. It will either do a buy on sushi that will fill the
         *  order or a mint on NFTs that will return the remaining.
         */
    }

    function _senderOwnsNFT(address from, address vault, uint nftId) internal returns (bool) {
        return IERC721(INFTXVault(vault).assetAddress()).ownerOf(nftId) == from;
    }

    function _getVaultId(address vault) internal returns (uint) {
        return INFTXVault(vault).vaultId();
    }

    function _listingExists(uint listingId) internal returns (bool) {
        return listingId >= 0;
    }

}
