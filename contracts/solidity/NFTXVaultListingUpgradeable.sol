// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXFeeDistributor.sol";
import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXVaultListing.sol";
import "./interface/IERC2981.sol";
import "./testing/IERC1155.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/SafeMathUpgradeable.sol";


// Authors: @tomwade.

/**
 * @dev Contract to allow listings to be created with a specified price
 * against an NFTX vault.
 */

contract NFTXVaultListingUpgradeable is INFTXVaultListing, OwnableUpgradeable {

    using SafeMathUpgradeable for uint8;
    using SafeMathUpgradeable for uint24;
    using SafeMathUpgradeable for uint32;
    using SafeMathUpgradeable for uint256;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    /**
     * @notice The structure of a 721 listing.
     */

    struct Listing721 {
        address seller;     // 160/256
        uint32 price;       // 192/256  Allows for 6 decimal accuracy
        uint32 expiryTime;  // 224/256
        uint8 royaltyFee;   // 232/256  Allows for 0 - 99 support
    }


    /**
     * @notice The structure of a 1155 listing.
     */

    struct Listing1155 {
        address seller;     // 160/256
        uint24 amount;      // 184/256
        uint32 price;       // 216/256  Allows for 6 decimal accuracy
        uint32 expiryTime;  // 248/256
        uint8 royaltyFee;   // 256/256  Allows for 0 - 99 support
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

    // {ListingFilled} fired when an existing listing is successfully filled
    event RoyaltiesUpdated(
        address vault,
        uint256 royaltyFee
    );

    // Mapping of listingId => Listing
    mapping(bytes32 => Listing721) public listings721;
    mapping(bytes32 => Listing1155) public listings1155;

    // Mapping of NFTX vault data
    mapping(address => uint8) public nftxVault1155;
    mapping(address => address) public nftxVaultAsset;
    mapping(address => uint256) public nftxVaultMintFee;

    // Stores the minimum floor price for new listings
    uint32 public minFloorPrice;

    address private vaultFactoryAddress;


    /**
     * @notice Initialises the NFTX Vault Listing contract and sets a minimum
     * listing price.
     */

    function __NFTXVaultListing_init(address _vaultFactoryAddress) public virtual initializer {
        __Ownable_init();
        minFloorPrice = 1200000;
        vaultFactoryAddress = _vaultFactoryAddress;
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
     * @param nftId       The IDs of the NFTs being submitted
     * @param vault       The addresses of the NFTX vaults
     * @param price       Token price item will be listed at
     * @param amount      Number of 1155 tokens, should be 0 for 721s
     * @param expiry      The timestamp the listing will expire
     * @param royaltyFee  The royalty fee applied to the listing
     */

    function createListing(
        uint256 nftId,
        address vault,
        uint32 price,
        uint24 amount,
        uint32 expiry,
        uint8 royaltyFee
    ) external override {
        // Don't let the user create a listing that expires in the past
        require(expiry > block.timestamp, 'Listing already expired');

        // Sanity check our pricing is above minimum
        require(price >= minFloorPrice, 'Listing below floor price');

        if(getNFTXVaultIs1155(vault)) {
            require(amount > 0, 'Invalid token submitted to vault');
            _createListing1155(msg.sender, nftId, vault, price, expiry, amount, royaltyFee);
        }
        else {
            require(amount == 0, 'Invalid token submitted to vault');
            _createListing721(msg.sender, nftId, vault, price, expiry, royaltyFee);
        }
    }


    /**
     * @notice Allows approved ERC721 NFTs to be listed against a vault. The NFT must
     * belong to the asset address stored against the NFTX vault and have an expiry
     * timestamp set in the future.
     *
     * @param nftIds       The IDs of the NFTs being submitted
     * @param vaults       The addresses of the NFTX vaults
     * @param prices       Token price item will be listed at
     * @param amounts      Number of 1155 tokens, should be 0 for 721s
     * @param expires      The timestamp the listing will expire
     * @param royaltyFees  The royalty fee applied to the listing
     */

    function createListings(
        uint256[] calldata nftIds,
        address[] calldata vaults,
        uint32[] calldata prices,
        uint24[] calldata amounts,
        uint32[] calldata expires,
        uint8[] calldata royaltyFees
    ) external override {
        uint256 count = nftIds.length;
        require(count > 0);

        for (uint256 i; i < count;) {
            address vault = vaults[i];
            uint256 nftId = nftIds[i];
            uint32 price = prices[i];
            uint24 amount = amounts[i];
            uint32 expiryTime = expires[i];
            uint8 royaltyFee = royaltyFees[i];

            // Don't let the user create a listing that expires in the past
            require(expiryTime > block.timestamp, 'Listing already expired');

            // Sanity check our pricing is above minimum
            require(price >= minFloorPrice, 'Listing below floor price');

            if (getNFTXVaultIs1155(vault)) {
                require(amount > 0, 'Invalid token submitted to vault');
                _createListing1155(msg.sender, nftId, vault, price, expiryTime, amount, royaltyFee);
            }
            else {
                require(amount == 0, 'Invalid token submitted to vault');
                _createListing721(msg.sender, nftId, vault, price, expiryTime, royaltyFee);
            }

            unchecked { ++i; }
        }
    }


    /**
     * @notice Creates a listing object and updates our internal mappings.
     *
     * @param seller      The address of the seller creating the listing
     * @param nftId       The ERC721 NFT ID
     * @param vault       The NFTX Vault address
     * @param price       The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry      The timestamp that the listing will expire
     * @param royaltyFee  The royalty fee applied to the listing
     */

    function _createListing721(
        address seller,
        uint256 nftId,
        address vault,
        uint32 price,
        uint32 expiry,
        uint8 royaltyFee
    ) internal {
        // Get our 721 listing ID
        bytes32 listingId = getListingId721(vault, nftId);

        // Add our listing
        listings721[listingId] = Listing721(seller, price, expiry, royaltyFee);

        emit ListingCreated(seller, vault, nftId, 0, price, expiry);
    }


    /**
     * @notice Creates a listing object and updates our internal mappings.
     *
     * @param seller      The address of the seller creating the listing
     * @param nftId       The ERC1155 NFT ID
     * @param vault       The NFTX Vault address
     * @param price       The price of the listing in terms of the NFTX vault ERC20 token
     * @param expiry      The timestamp that the listing will expire
     * @param amount      The number of NFT tokens in the listing
     * @param royaltyFee  The royalty fee applied to the listing
     */

    function _createListing1155(
        address seller,
        uint256 nftId,
        address vault,
        uint32 price,
        uint32 expiry,
        uint24 amount,
        uint8 royaltyFee
    ) internal {
        // Get our 1155 listing ID
        bytes32 listingId = getListingId1155(vault, nftId, seller, price, expiry, royaltyFee);

        // Add our listing
        listings1155[listingId] = Listing1155(seller, amount, price, expiry, royaltyFee);

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

        if(getNFTXVaultIs1155(vault)) {
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

            if(getNFTXVaultIs1155(vault)) {
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
        if(getNFTXVaultIs1155(vault)) {
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

            if(getNFTXVaultIs1155(vault)) {
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

        // Process our listing fees
        _processListingFees(
            vault,                                 // The address of our NFTX vault
            buyer,                                 // Buyer address
            existingListing.seller,                // Seller address
            existingListing.price.mul(10e11),      // Convert our 6 decimal listing price to 18 decimals for token transfer
            getNFTXVaultMintFee(vault),            // Get the NFTX vault minting fee
            existingListing.royaltyFee.mul(10e16)  // Get the listing's royalty fee
        );

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

        // Process our listing fees
        _processListingFees(
            vault,                                             // The address of our NFTX vault
            buyer,                                             // Buyer address
            existingListing.seller,                            // Seller address
            existingListing.price.mul(10e11).mul(amount),      // Convert our 6 decimal listing price to 18 decimals for token transfer
            getNFTXVaultMintFee(vault),                        // Get the NFTX vault minting fee
            existingListing.royaltyFee.mul(10e16).mul(amount)  // Get the listing's royalty fee
        );

        // Send NFT to buyer
        IERC1155(getNFTXVaultAssetAddress(vault)).safeTransferFrom(
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
     * @notice Handles the distribution of any fees associated to a listing.
     * 
     * @param vault                 The addresses of the NFTX vault
     * @param buyer                 The address of the listing buyer
     * @param seller                The address of the listing seller
     * @param transferTokenAmount   The number of tokens to send to the listing seller
     * @param mintFee               The minting fee imposed by the NFTX vault
     * @param royaltyFee            The royalty fee applied to the listing
     */

    function _processListingFees(
        address vault,
        address buyer,
        address seller,
        uint256 transferTokenAmount,
        uint256 mintFee,
        uint256 royaltyFee
    ) internal {
        // Get our combined fees for later calculations
        uint256 combinedFees = mintFee.add(royaltyFee);

        // If our fees are higher than the sale price, then level it out
        if (combinedFees > transferTokenAmount) {
            combinedFees = transferTokenAmount;
        }

        // Determine the amount our end seller will receive
        uint256 sellerReceives = transferTokenAmount.sub(combinedFees);

        // Map our NFTX vault
        INFTXVault nftxVault = INFTXVault(vault);

        // Send the seller tokens from the buyer, minus the mint fees that will be distributed
        if (sellerReceives > 0) {
            nftxVault.transferFrom(buyer, seller, sellerReceives);
        }

        // Reference our vault factory
        INFTXVaultFactory vaultFactory = INFTXVaultFactory(vaultFactoryAddress);

        // Check if our user is excluded from paying NFTX fees
        if (vaultFactory.excludedFromFees(seller)) {
            return;
        }

        // Send the mint fee to the fee distributooooor
        if (mintFee > 0) {
            // Mint fees directly to the distributor and distribute.
            address feeDistributor = vaultFactory.feeDistributor();
            nftxVault.transferFrom(buyer, feeDistributor, mintFee);
            INFTXFeeDistributor(feeDistributor).distribute(nftxVault.vaultId());
        }

        // If we have a royalty fee to pay then dispatch the fee to the recipient
        // address for the royalty.
        if (royaltyFee > 0) {
            address royaltyFeeRecipient = getRoyaltyFeeRecipientAddress(vault);

            if (royaltyFeeRecipient != address(0)) {
                nftxVault.transferFrom(buyer, royaltyFeeRecipient, royaltyFee);
            }
        }
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
        address asset = getNFTXVaultAssetAddress(vault);

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
     * @param expiry The timestamp the listing will expire
     * @param royaltyFee The royalty fee applied to the listing
     */

    function getListingId1155(
        address vault,
        uint256 nftId,
        address seller,
        uint32 price,
        uint32 expiry,
        uint16 royaltyFee
    ) public view returns (bytes32) {
        return keccak256(abi.encode(vault, nftId, seller, price, expiry, royaltyFee));
    }


    /**
     * @notice Caches an NFTX vault's boolean value for if it is a 721 or
     * 1155 vault. This stores the value as an integer internally, as we
     * need to also check if it has been set or not.
     * 
     * If this value needs to be updated (if the external vault is updated),
     * then `purgeNFTXCache` should be called by the owner to flush this cache.
     *
     * @param vault The NFTX Vault asset address
     */

    function getNFTXVaultIs1155(address vault) internal returns (bool) {
        if (nftxVault1155[vault] > 0) {
            return nftxVault1155[vault] == 1;
        }

        nftxVault1155[vault] = INFTXVault(vault).is1155() ? 1 : 2;
        return nftxVault1155[vault] == 1;
    }


    /**
     * @notice Caches an NFTX asset address to reduce gas costs. This stores
     * the address to prevent having to load an external contract.
     * 
     * If this value needs to be updated (if the external vault is updated),
     * then `purgeNFTXCache` should be called by the owner to flush this cache.
     *
     * @param vault The NFTX Vault asset address
     */

    function getNFTXVaultAssetAddress(address vault) internal returns (address) {
        if (nftxVaultAsset[vault] != address(0)) {
            return nftxVaultAsset[vault];
        }

        nftxVaultAsset[vault] = INFTXVault(vault).assetAddress();
        return nftxVaultAsset[vault];
    }


    /**
     * @notice Caches an NFTX vault mint fee. This stores the uint256 to prevent
     * having to load an external contract.
     * 
     * If this value needs to be updated (if the external vault is updated),
     * then `purgeNFTXCache` should be called by the owner to flush this cache.
     *
     * @param vault The NFTX Vault asset address
     */

    function getNFTXVaultMintFee(address vault) internal returns (uint256) {
        if (nftxVaultMintFee[vault] != 0) {
            return nftxVaultMintFee[vault];
        }

        nftxVaultMintFee[vault] = INFTXVault(vault).mintFee();
        return nftxVaultMintFee[vault];
    }


    /**
     * @notice Attempt to capture the desired royalty address of an asset using the
     * ERC2981 standard.
     * 
     * @param vault The NFTX Vault asset address
     */

    function getRoyaltyFeeRecipientAddress(address vault) internal returns (address) {
        address asset = getNFTXVaultAssetAddress(vault);

        // Check if the asset contract supports the ERC2981
        if (IERC165(asset).supportsInterface(_INTERFACE_ID_ERC2981)) {
            return address(0);
        }

        (address recipient, ) = IERC2981(asset).royaltyInfo(1, 1);
        return recipient;
    }


    /**
     * @notice Clears any cached external NFTX vault data,
     * 
     * @param vault The NFTX Vault asset address
     */

    function purgeNFTXCache(address vault) external onlyOwner {
        nftxVault1155[vault] = 0;
        nftxVaultAsset[vault] = address(0);
        nftxVaultMintFee[vault] = 0;
    }

}
