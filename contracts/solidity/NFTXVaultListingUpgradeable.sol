// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultListing.sol";
import "./testing/IERC721.sol";
import "./testing/IERC1155.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/SafeMathUpgradeable.sol";


// Authors: @tomwade.

/**
 * @dev Contract to allow listings to be created with a specified price
 * against an NFTX vault.
 */

contract NFTXVaultListingUpgradeable is INFTXVaultListing, OwnableUpgradeable {

    using SafeMathUpgradeable for uint24;
    using SafeMathUpgradeable for uint32;
    using SafeMathUpgradeable for uint256;

    /**
     * @notice The structure of a 721 listing.
     */

    struct Listing721 {
        address seller;     // 160/256
        uint32 price;       // 192/256  Allows for 6 decimal accuracy
        uint32 expiryTime;  // 224/256
    }


    /**
     * @notice The structure of a 1155 listing.
     */

    struct Listing1155 {
        address seller;     // 160/256
        uint24 amount;      // 184/256
        uint32 price;       // 216/256  Allows for 6 decimal accuracy
        uint32 expiryTime;  // 248/256
    }

    // {ListingCreated} fired when a new listing is created
    event ListingCreated(
        address seller,
        address vault,
        uint256 nftId,
        uint24 amount,
        uint32 price,
        uint32 expiryTime
    );

    // {ListingUpdated} fired when an existing listing is updated
    event ListingUpdated(
        address seller,
        address vault,
        uint256 nftId,
        uint24 amount,
        uint32 price,
        uint32 expiryTime
    );

    // {ListingDeleted} fired when an existing listing is removed
    event ListingDeleted(
        bytes32 listingId
    );

    // {ListingFilled} fired when an existing listing is successfully filled
    event ListingFilled(
        bytes32 listingId,
        uint24 amount,
        uint32 price
    );

    // Mapping of listingId => Listing
    mapping(bytes32 => Listing721) public listings721;
    mapping(bytes32 => Listing1155) public listings1155;

    // Stores the minimum floor price for new listings
    uint32 public minFloorPrice;


    /**
     * @notice Initialises the NFTX Vault Listing contract and sets a minimum
     * listing price.
     */

    function __NFTXVaultListing_init() public virtual initializer {
        __Ownable_init();
        minFloorPrice = 1200000;
    }


    /**
     * @notice Allows authorised users to set a new minimum listing price.
     *
     * @param _minFloorPrice New minimum listing price
     */

    function setFloorPrice(uint32 _minFloorPrice) external onlyOwner {
        minFloorPrice = _minFloorPrice;
    }


    /**
     * @notice Allows approved ERC721 NFTs to be listed against a vault. The NFT must
     * belong to the asset address stored against the NFTX vault and have an expiry
     * timestamp set in the future.
     *
     * @param nftId   The IDs of the NFTs being submitted
     * @param vault   The addresses of the NFTX vaults
     * @param price   Token price item will be listed at
     * @param amount  Number of 1155 tokens, should be 0 for 721s
     * @param expiry  The timestamp the listing will expire
     */

    function createListing(
        uint256 nftId,
        address vault,
        uint32 price,
        uint24 amount,
        uint32 expiry
    ) external override {
        // Don't let the user create a listing that expires in the past
        require(expiry > block.timestamp, 'Listing already expired');

        // Sanity check our pricing is above minimum
        require(price >= minFloorPrice, 'Listing below floor price');

        if(INFTXVault(vault).is1155()) {
            require(amount > 0, 'Invalid token submitted to vault');
            _createListing1155(msg.sender, nftId, vault, price, expiry, amount);
        }
        else {
            require(amount == 0, 'Invalid token submitted to vault');
            _createListing721(msg.sender, nftId, vault, price, expiry);
        }
    }


    /**
     * @notice Allows approved ERC721 NFTs to be listed against a vault. The NFT must
     * belong to the asset address stored against the NFTX vault and have an expiry
     * timestamp set in the future.
     *
     * @param nftIds   The IDs of the NFTs being submitted
     * @param vaults   The addresses of the NFTX vaults
     * @param prices   Token price item will be listed at
     * @param amounts  Number of 1155 tokens, should be 0 for 721s
     * @param expires  The timestamp the listing will expire
     */

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint32[] calldata prices,
        uint24[] calldata amounts,
        uint32[] calldata expires
    ) external override {
        uint256 count = nftIds.length;
        require(count > 0);

        for (uint256 i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            uint32 price = prices[i];
            uint24 amount = amounts[i];
            uint32 expiryTime = expires[i];

            // Don't let the user create a listing that expires in the past
            require(expiryTime > block.timestamp, 'Listing already expired');

            // Sanity check our pricing is above minimum
            require(price >= minFloorPrice, 'Listing below floor price');

            if(INFTXVault(vault).is1155()) {
                require(amount > 0, 'Invalid token submitted to vault');
                _createListing1155(msg.sender, nftId, vault, price, expiryTime, amount);
            }
            else {
                require(amount == 0, 'Invalid token submitted to vault');
                _createListing721(msg.sender, nftId, vault, price, expiryTime);
            }

            unchecked { ++i; }
        }
    }


    /**
     * @notice Creates a listing object and updates our internal mappings.
     *
     * @param seller  The address of the seller creating the listing
     * @param nftId   The ERC721 NFT ID
     * @param vault   The NFTX Vault address
     * @param price   The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry  The timestamp that the listing will expire
     */

    function _createListing721(
        address seller,
        uint256 nftId,
        address vault,
        uint32 price,
        uint32 expiry
    ) internal {
        // Get our 721 listing ID
        bytes32 listingId = getListingId721(vault, nftId);

        // Create our listing object
        // Listing721 memory listing = Listing721(seller, price, expiry);

        // Add our listing
        listings721[listingId] = Listing721(seller, price, expiry);

        emit ListingCreated(seller, vault, nftId, 0, price, expiry);
    }


    /**
     * @notice Creates a listing object and updates our internal mappings.
     *
     * @param seller The address of the seller creating the listing
     * @param nftId The ERC1155 NFT ID
     * @param vault The NFTX Vault address
     * @param price The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry The timestamp that the listing will expire
     * @param amount The number of NFT tokens in the listing
     */

    function _createListing1155(
        address seller,
        uint256 nftId,
        address vault,
        uint32 price,
        uint32 expiry,
        uint24 amount
    ) internal {
        // Get our 1155 listing ID
        bytes32 listingId = getListingId1155(vault, nftId, seller, price);

        // Create our listing object
        // Listing1155 memory listing = Listing1155(seller, amount, price, expiry);

        // Add our listing
        listings1155[listingId] = Listing1155(seller, amount, price, expiry);

        emit ListingCreated(seller, vault, nftId, amount, price, expiry);
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftId      The IDs of the NFTs being updated
     * @param vault      The addresses of the NFTX vaults
     * @param listingId  The listing ID previously generated
     * @param price      Token price listing will be updated to
     * @param expiry     The updated timestamp the listing will expire
     * @param amount     Amount of NFT tokens in the listing
     */

    function updateListing(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint32 price,
        uint32 expiry,
        uint24 amount
    ) external override {
        require(price >= minFloorPrice, 'Listing below floor price');

        INFTXVault nftxVault = INFTXVault(vault);

        if(nftxVault.is1155()) {
            Listing1155 memory existingListing = listings1155[listingId];

            require(existingListing.expiryTime > block.timestamp, 'Listing has expired');
            require(existingListing.seller == msg.sender, 'Sender is not listing owner');

            _updateListing1155(nftId, vault, listingId, price, expiry, amount);
        }
        else {
            Listing721 memory existingListing = listings721[listingId];

            require(existingListing.expiryTime > block.timestamp, 'Listing has expired');
            require(existingListing.seller == msg.sender, 'Sender is not listing owner');

            _updateListing721(nftId, vault, listingId, price, expiry);
        }
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds      The IDs of the NFTs being updated
     * @param vaults      The addresses of the NFTX vaults
     * @param listingIds  The listing IDs previously generated
     * @param prices      Token price listing will be updated to
     * @param expires     The updated timestamp the listing will expire
     */

    function updateListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        bytes32[] calldata listingIds,
        uint32[] calldata prices,
        uint32[] calldata expires,
        uint24[] calldata amounts
    ) external override {
        uint256 count = nftIds.length;
        require(count > 0, 'No NFTs specified');

        for (uint256 i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            bytes32 listingId = listingIds[i];
            uint32 price = prices[i];
            uint32 expiry = expires[i];
            uint24 amount = amounts[i];

            require(price >= minFloorPrice, 'Listing below floor price');

            INFTXVault nftxVault = INFTXVault(vault);

            if(nftxVault.is1155()) {
                Listing1155 memory existingListing = listings1155[listingId];

                require(existingListing.expiryTime > block.timestamp, 'Listing has expired');
                require(existingListing.seller == msg.sender, 'Sender is not listing owner');

                _updateListing1155(nftId, vault, listingId, price, expiry, amount);
            }
            else {
                Listing721 memory existingListing = listings721[listingId];

                require(existingListing.expiryTime > block.timestamp, 'Listing has expired');
                require(existingListing.seller == msg.sender, 'Sender is not listing owner');

                _updateListing721(nftId, vault, listingId, price, expiry);
            }

            unchecked { ++i; }
        }
    }


    /**
     * @notice Updates a listing object.
     *
     * @param nftId      The ERC721 NFT ID
     * @param vault      The NFTX Vault address
     * @param listingId  The listing ID previously generated
     * @param price      The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry     The timestamp that the listing will expire
     */

    function _updateListing721(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint32 price,
        uint32 expiry
    ) internal {
        // Confirm that our listing exists
        require(_listingExists(listingId, false), 'Listing ID does not exist');

        if (expiry == 0) {
            delete listings721[listingId];
            emit ListingDeleted(listingId);
            return;
        }

        Listing721 storage listing = listings721[listingId];

        // Set our listing price
        listing.price = price;

        // Set the listing to new expiry time
        listing.expiryTime = expiry;

        emit ListingUpdated(listing.seller, vault, nftId, 0, price, expiry);
    }


    /**
     * @notice Updates a listing object.
     *
     * @param nftId      The ERC1155 NFT ID
     * @param vault      The NFTX Vault address
     * @param listingId  The listing ID previously generated
     * @param price      The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry     The timestamp that the listing will expire
     * @param amount     Amount of NFT tokens in the listing
     */

    function _updateListing1155(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint32 price,
        uint32 expiry,
        uint24 amount
    ) internal {
        // Confirm that our listing exists
        require(_listingExists(listingId, true), 'Listing ID does not exist');

        if (expiry == 0) {
            delete listings1155[listingId];
            emit ListingDeleted(listingId);
            return;
        }

        Listing1155 storage listing = listings1155[listingId];

        // Set our listing price
        listing.price = price;

        // Set the listing to new expiry time
        listing.expiryTime = expiry;

        // Set our amount price
        listing.amount = amount;

        emit ListingUpdated(listing.seller, vault, nftId, amount, price, expiry);
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftId      The IDs of the NFTs being filled
     * @param vault      The addresses of the NFTX vaults
     * @param listingId  The listing ID previously generated
     * @param amount     Number of 1155 tokens, should be 0 for 721s
     */

    function fillListing(
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint24 amount
    ) external override {
        if(INFTXVault(vault).is1155()) {
            _fillListing1155(msg.sender, nftId, vault, listingId, amount);
        }
        else {
            _fillListing721(msg.sender, nftId, vault, listingId);
        }
    }


    /**
     * @notice Allows existing listings to have their expiry time and price updated. If
     * the listing has it's expiry timestamp into the past, then it will set the listing
     * to inactive. If a `0` value is set for the expiry timestamp then the listing will
     * also be deleted from our mapping.
     *
     * @param nftIds      The IDs of the NFTs being filled
     * @param vaults      The addresses of the NFTX vaults
     * @param listingIds  The listing ID previously generated
     * @param amounts     Number of 1155 tokens, should be 0 for 721s
     */

    function fillListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        bytes32[] calldata listingIds,
        uint24[] calldata amounts
    ) external override {
        uint256 count = nftIds.length;
        require(count > 0);

        for (uint256 i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            bytes32 listingId = listingIds[i];
            uint24 amount = amounts[i];

            if(INFTXVault(vault).is1155()) {
                _fillListing1155(msg.sender, nftId, vault, listingId, amount);
            }
            else {
                _fillListing721(msg.sender, nftId, vault, listingId);
            }

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
        address vault,
        bytes32 listingId
    ) internal {
        // Confirm that our listing exists
        require(_listingExists(listingId, false), 'Listing ID does not exist');

        Listing721 storage existingListing = listings721[listingId];

        // Confirm the listing has not expired
        require(existingListing.expiryTime > block.timestamp, 'Listing has expired');

        // Map our NFTX vault
        INFTXVault nftxVault = INFTXVault(vault);

        // Convert our 6 decimal listing price to 18 decimals for token transfer
        uint256 transferTokenAmount = existingListing.price.mul(10e11);

        // Send the seller tokens from the buyer
        nftxVault.transferFrom(buyer, existingListing.seller, transferTokenAmount);

        // Send NFT to buyer
        _transfer(existingListing.seller, buyer, vault, nftId, 0);

        // If we no longer have any amount in the listing, we can deactivate the
        // listing by setting expiry time to 0.
        delete listings721[listingId];

        emit ListingFilled(listingId, 0, existingListing.price);
    }


    /**
     * @notice Fills a listing object and transfers the relevant tokens and NFTs.
     *
     * @param buyer      The address of the user buying the NFT
     * @param nftId      The ERC721 NFT ID
     * @param vault      The NFTX Vault address
     * @param listingId  The listing ID previously generated
     * @param amount     Number of tokens to purchase
     */

    function _fillListing1155(
        address buyer,
        uint256 nftId,
        address vault,
        bytes32 listingId,
        uint24 amount
    ) internal {
        // Confirm that our listing exists
        require(_listingExists(listingId, true), 'Listing ID does not exist');

        Listing1155 storage existingListing = listings1155[listingId];

        // Request must be for more than 0 tokens
        require(amount > 0, 'Cannot buy 0 tokens');

        // Confirm the listing has not expired
        require(existingListing.expiryTime > block.timestamp, 'Listing has expired');

        // Confirm there is enough amount in the listing
        require(existingListing.amount >= amount, 'Insufficient tokens in listing');

        // Calculate our purchase price
        uint256 purchaseAmount = existingListing.price.mul(10e11).mul(amount);

        // Map our NFTX vault
        INFTXVault nftxVault = INFTXVault(vault);

        // Send the seller tokens from the buyer
        nftxVault.transferFrom(buyer, existingListing.seller, purchaseAmount);

        // Send NFT to buyer
        IERC1155(nftxVault.assetAddress()).safeTransferFrom(
            existingListing.seller, buyer, nftId, amount, ''
        );

        // Reduce the amount available in our listing
        existingListing.amount = existingListing.amount - amount;

        // If we no longer have any amount in the listing, we can deactivate the
        // listing by setting expiry time to 0.
        if (existingListing.amount == 0) {
            delete listings1155[listingId];
        }

        emit ListingFilled(listingId, amount, existingListing.price);
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
     * @notice Creates a listing ID for a 721 listing.
     *
     * @param vault The NFTX Vault asset address
     * @param nftId The ID of the NFT token
     */

    function getListingId721(
        address vault,
        uint256 nftId
    ) public view returns (bytes32) {
        return keccak256(abi.encode(vault, nftId));
    }


    /**
     * @notice Creates a listing ID for a 1155 listing.
     *
     * @param vault The NFTX Vault asset address
     * @param nftId The ID of the NFT token
     * @param seller The address of the seller that created the listing
     * @param price Token price item is listed at
     */

    function getListingId1155(
        address vault,
        uint256 nftId,
        address seller,
        uint32 price
    ) public view returns (bytes32) {
        return keccak256(abi.encode(vault, nftId, seller, price));
    }

}
