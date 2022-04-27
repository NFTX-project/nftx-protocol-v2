// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultListing.sol";
import "./testing/IERC721.sol";
import "./testing/IERC1155.sol";
import "./util/OwnableUpgradeable.sol";


// Authors: @tomwade.

/**
 * @dev Contract to allow listings to be created with a specified price
 * against an NFTX vault.
 */

contract NFTXVaultListingUpgradeable is INFTXVaultListing, OwnableUpgradeable {

    /**
     * @notice The structure of a 721 listing.
     */

    struct Listing721 {
        address seller;     // 160/256
        uint24 price;       // 184/256
        uint32 expiryTime;  // 216/256
        uint8 settings;     // 224/256
    }


    /**
     * @notice The structure of a 1155 listing.
     */

    struct Listing1155 {
        address seller;     // 160/256
        uint24 amount;      // 184/256
        uint24 price;       // 208/256
        uint32 expiryTime;  // 240/256
        uint8 settings;     // 248/256
    }

    // {ListingCreated} fired when a new listing is created
    event ListingCreated(bytes32 listingId);

    // {ListingUpdated} fired when an existing listing is updated
    event ListingUpdated(bytes32 listingId);

    // {ListingFilled} fired when an existing listing is successfully filled
    event ListingFilled(bytes32 listingId, uint amount);

    // Mapping of listingId => Listing
    mapping(bytes32 => Listing721) listings721;
    mapping(bytes32 => Listing1155) listings1155;

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
     * @param amounts Number of 1155 tokens, should be 0 for 721s
     * @param expires The timestamp the listing will expire
     */

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint24[] calldata prices,
        uint24[] calldata amounts,
        uint32[] calldata expires
    ) external override {
        uint count = nftIds.length;
        require(count > 0);

        for (uint i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            uint24 price = prices[i];
            uint24 amount = amounts[i];
            uint32 expiryTime = expires[i];

            // Don't let the user create a listing that expires in the past
            require(expiryTime > block.timestamp, 'Listing already expired');

            // Sanity check our pricing is above minimum
            require(price >= minFloorPrice, 'Listing below floor price');

            // Confirm that our user owns the NFT and has approved the listing to use
            require(_senderOwnsNFT(msg.sender, vault, nftId, amount), 'Sender does not own NFT');
            require(_senderApprovedNFT(msg.sender, vault, nftId), 'Sender has not approved NFT');

            // Confirm that we are sending the correct ERC type
            require(_validateVaultToken(vault, amount), 'Invalid token submitted to vault');

            if(INFTXVault(vault).is1155()) {
                // TODO: _updateListing1155();
            }

            _createListing721(msg.sender, nftId, vault, price, expiryTime);

            unchecked { ++i; }
        }
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

    function _createListing721(
        address seller,
        uint256 nftId,
        address vault,
        uint24 price,
        uint32 expiry
    ) internal {
        // Get our 721 listing ID
        bytes32 listingId = getListingId721(vault, nftId);

        // Create our listing object
        Listing721 memory listing = Listing721(seller, price, expiry, 0);

        // Add our listing
        listings721[listingId] = listing;

        emit ListingCreated(listingId);
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds The IDs of the NFTs being updated
     * @param vaults The addresses of the NFTX vaults
     * @param prices Token price listing will be updated to
     * @param expires The updated timestamp the listing will expire
     */

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint24[] calldata prices,
        uint32[] calldata expires
    ) external override {
        uint count = nftIds.length;
        require(count > 0, 'No NFTs specified');

        for (uint i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            uint24 price = prices[i];
            uint32 expiry = expires[i];

            if(INFTXVault(vault).is1155()) {
                // TODO: _updateListing1155();
            }

            _updateListing721(nftId, vault, price, expiry);

            unchecked { ++i; }
        }
    }


    /**
     * @notice Updates a listing object.
     *
     * @param nftId The ERC721 NFT ID
     * @param vault The NFTX Vault address
     * @param price The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry The timestamp that the listing will expire
     */

    function _updateListing721(
        uint256 nftId,
        address vault,
        uint24 price,
        uint32 expiry
    ) internal {
        // Confirm that our listing exists
        bytes32 listingId = getListingId721(vault, nftId);
        require(_listingExists(listingId, false), 'Listing ID does not exist');

        Listing721 memory existingListing = listings721[listingId];

        require(existingListing.expiryTime < block.timestamp, 'Listing is not active');
        require(existingListing.seller == msg.sender, 'Sender is not listing owner');

        // Confirm the updated price is above minimum if changed
        require(price >= minFloorPrice, 'Listing below floor price');

        // If the NFT is no longer owned or is no longer approved, then we close the listing
        // at the expense of the updater.
        bool owned = _senderOwnsNFT(msg.sender, vault, nftId, 1);
        bool approved = _senderApprovedNFT(msg.sender, vault, nftId);

        if (!owned || !approved) {
            return;
        }

        if (expiry == 0) {
            delete listings721[listingId];
            return;
        }

        Listing721 storage listing = listings721[listingId];

        // Set our listing price
        listing.price = price;

        // Set the listing to new expiry time
        listing.expiryTime = expiry;

        emit ListingUpdated(listingId);
    }






    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds The IDs of the NFTs being filled
     * @param vaults The addresses of the NFTX vaults
     * @param amounts Number of 1155 tokens, should be 0 for 721s
     */

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint24[] calldata amounts
    ) external override {
        uint count = nftIds.length;
        require(count > 0);

        for (uint i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            uint24 amount = amounts[i];

            if(INFTXVault(vault).is1155()) {
                // TODO: _fillListing1155();
            }

            _fillListing721(msg.sender, nftId, vault);

            unchecked { ++i; }
        }
    }


    /**
     * @notice Fills a listing object and transfers the relevant tokens and NFTs.
     *
     * @param buyer The address of the user buying the NFT
     * @param nftId The ERC721 NFT ID
     * @param vault The NFTX Vault address
     */

    function _fillListing721(
        address buyer,
        uint256 nftId,
        address vault
    ) internal {
        // Confirm that our listing exists
        bytes32 listingId = getListingId721(vault, nftId);
        require(_listingExists(listingId, false), 'Listing ID does not exist');

        Listing721 storage existingListing = listings721[listingId];

        // Confirm the buyer is not the seller
        require(existingListing.seller != msg.sender, 'Buyer cannot be seller');

        // Confirm the listing has not expired
        require(existingListing.expiryTime > block.timestamp, 'Listing has expired');

        // Map our NFTX vault
        INFTXVault nftxVault = INFTXVault(vault);

        // Send the seller tokens from the buyer
        nftxVault.transferFrom(buyer, existingListing.seller, existingListing.price);

        // Send NFT to buyer
        _transfer(existingListing.seller, buyer, vault, nftId, 0);

        // If we no longer have any amount in the listing, we can deactivate the
        // listing by setting expiry time to 0.
        _updateListing721(nftId, vault, existingListing.price, 0);

        emit ListingFilled(listingId, 1);
    }


    /**
     * @notice Fills a listing object and transfers the relevant tokens and NFTs.
     *
     * @param buyer  The address of the user buying the NFT
     * @param nftId  The ERC721 NFT ID
     * @param vault  The NFTX Vault address
     * @param amount Number of tokens to purchase
     */

    /*
    function _fillListing1155(
        address buyer,
        uint256 nftId,
        address vault,
        uint32 amount
    ) internal {
        // Confirm that our listing exists
        bytes32 listingId = getListingId1155(vault, nftId, msg.sender, minFloorPrice);
        require(_listingExists(listingId), 'Listing ID does not exist');

        Listing721 storage existingListing = listings721[listingId];

        // Confirm the listing is active
        require(existingListing.active, 'Listing is not active');

        // Confirm the buyer is not the seller
        require(existingListing.seller != msg.sender, 'Buyer cannot be seller');

        // Confirm the listing has not expired
        require(existingListing.expiry > block.timestamp, 'Listing has expired');

        // Confirm there is enough amount in the listing
        require(existingListing.amount >= amount, 'Insufficient tokens in listing');

        // Calculate our purchase price
        uint purchaseAmount = existingListing.price;
        if (amount > 0) {
            purchaseAmount = purchaseAmount * amount;
        }

        // Map our NFTX vault
        INFTXVault nftxVault = INFTXVault(vault);

        // Send the seller tokens from the buyer
        nftxVault.transferFrom(buyer, existingListing.seller, purchaseAmount);

        // Send NFT to buyer
        _transfer(existingListing.seller, buyer, vault, nftId, amount);

        // Reduce the amount available in our listing
        existingListing.amount = existingListing.amount - amount;

        // If we no longer have any amount in the listing, we can deactivate the
        // listing by setting expiry time to 0.
        if (!nftxVault.is1155() || existingListing.amount == 0) {
            _updateListing1155(nftId, vault, existingListing.price, 0);
        }

        emit ListingFilled(listingId, amount);
    }
    */


    /**
     * @notice Checks that a user owns the NFT specified.
     *
     * @param from The address of the user
     * @param vault The NFTX Vault address
     * @param nftId The NFT ID
     * @param amount Number of 1155 tokens, should be 0 for 721s
     */

    function _senderOwnsNFT(
        address from,
        address vault,
        uint256 nftId,
        uint24 amount
    ) internal returns (bool) {
        INFTXVault nftxVault = INFTXVault(vault);

        if (nftxVault.is1155()) {
            return IERC1155(nftxVault.assetAddress()).balanceOf(from, nftId) >= amount;
        }

        return IERC721(nftxVault.assetAddress()).ownerOf(nftId) == from;
    }


    /**
     * @notice Checks that a user has approved the NFT specified.
     *
     * @param from The address of the user
     * @param vault The NFTX Vault address
     * @param nftId The NFT ID
     */

    function _senderApprovedNFT(
        address from,
        address vault,
        uint256 nftId
    ) internal returns (bool) {
        INFTXVault nftxVault = INFTXVault(vault);

        if (nftxVault.is1155()) {
            return IERC1155(nftxVault.assetAddress()).isApprovedForAll(msg.sender, address(this));
        }

        return IERC721(nftxVault.assetAddress()).getApproved(nftId) == address(this);
    }


    /**
     * @notice Checks that a listing existst from our mapping.
     *
     * @param listingId The ID of the listing being queried
     */

    function _listingExists(bytes32 listingId, bool is1155) internal returns (bool) {
        if (is1155) {
            return listings1155[listingId].seller != address(0);
        }

        return listings721[listingId].seller != address(0);
    }


    /**
     * @notice Fills a listing object and transfers the relevant tokens and NFTs.
     *
     * @param from The address of the user selling the NFT
     * @param to The address of the user buying the NFT
     * @param vault The NFTX Vault asset address
     * @param nftId The NFT ID
     * @param amount Number of 1155 tokens, should be 0 for 721s
     */

    function _transfer(
        address from,
        address to,
        address vault,
        uint256 nftId,
        uint24 amount
    ) internal {
        INFTXVault nftxVault = INFTXVault(vault);
        address asset = nftxVault.assetAddress();

        if (nftxVault.is1155()) {
            IERC1155(asset).safeTransferFrom(from, to, nftId, amount, '');
            return;
        }

        address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
        address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;

        bytes memory data;
        bool success;
        bytes memory resultData;

        if (asset == kitties) {
            data = abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, nftId);
        } else if (asset == punks) {
            // Fix here for frontrun attack. Added in v1.0.2.
            bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", nftId);
            (success, resultData) = address(asset).staticcall(punkIndexToAddress);
            (address nftOwner) = abi.decode(resultData, (address));
            require(success && nftOwner == from, "Not the NFT owner");
            data = abi.encodeWithSignature("buyPunk(uint256)", nftId);
        } else {
            // We push to the vault to avoid an unneeded transfer.
            data = abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, nftId);
        }

        (success, resultData) = address(asset).call(data);
        require(success, string(resultData));

        if (asset == punks) {
            data = abi.encodeWithSignature("offerPunkForSaleToAddress(uint256,uint256,address)", nftId, 0, to);

            (success, resultData) = address(asset).call(data);
            require(success, string(resultData));
        }
    }


    /**
     * @notice Validates that the token ERC type matches expected vault token.
     *
     * @param vault The NFTX Vault asset address
     * @param amount Number of 1155 tokens, should be 0 for 721s
     */

    function _validateVaultToken(
        address vault,
        uint24 amount
    ) internal returns (bool) {
        if(INFTXVault(vault).is1155()) {
            return amount > 0;
        }

        return amount == 0;
    }


    /**
     * @notice Creates a listing ID for a 721 listing.
     *
     * @param vault TODO
     * @param nftId TODO
     */

    function getListingId721(
        address vault,
        uint256 nftId
    ) public returns (bytes32) {
        return keccak256(abi.encode(vault, nftId));
    }


    /**
     * @notice Creates a listing ID for a 1155 listing.
     *
     * @param vault TODO
     * @param nftId TODO
     * @param seller TODO
     * @param price TODO
     */

    function getListingId1155(
        address vault,
        uint256 nftId,
        address seller,
        uint24 price
    ) public returns (bytes32) {
        return keccak256(abi.encode(vault, nftId, seller, price));
    }

}
