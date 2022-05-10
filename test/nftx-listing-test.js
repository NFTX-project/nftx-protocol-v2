const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

let feeDistributorFactory, feeDistributor;
let inventoryStakingFactory, inventoryStaking;
let nftxVaultUpgragableFactory, nftxVault;
let nftxVaultListingFactory, nftxVaultListing;
let nftxVaultFactoryFactory, nftxVaultFactory;
let erc721Factory, vault, punkVault, tubbyVault;
let erc1155Factory, multiTokenVault;
let vaultArtifact;

let alice, bob, carol;
  
// We start with an offset so we don't conflict with other NFT IDs. We don't need
// to know the IDs as we just want to generate vault tokens from this.
let whaleNftCount = 50;

const belowValidFloorPrice = "1100000";
const validFloorPrice = "1200000";
const aboveValidFloorPrice = "1300000"

const futureTimestamp = "2000000000";  // Wed May 18 2033 03:33:20 GMT+0000
const anotherFutureTimestamp = "2000000010";  // Wed May 18 2033 03:33:30 GMT+0000

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";


describe('NFTX Vault Listings', async () => {

  before(async () => {
    // Set up our test users
    [primary, alice, bob, carol, whale, ...users] = await ethers.getSigners()

    feeDistributorFactory = await ethers.getContractFactory("MockDistributor");
    liquidityStakingFactory = await ethers.getContractFactory("NFTXLPStaking");
    inventoryStakingFactory = await ethers.getContractFactory("NFTXInventoryStaking")
    nftxVaultListingFactory = await ethers.getContractFactory("NFTXVaultListingUpgradeable")
    nftxVaultFactoryFactory = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable")
    erc721Factory = await ethers.getContractFactory("ERC721")
    erc1155Factory = await ethers.getContractFactory("ERC1155")

    const StakingProvider = await ethers.getContractFactory("MockStakingProvider");
    provider = await StakingProvider.deploy();
    await provider.deployed();

    // Set up our LP staking
    staking = await upgrades.deployProxy(
      liquidityStakingFactory,
      [provider.address], {
        initializer: "__NFTXLPStaking__init",
        unsafeAllow: 'delegatecall'
      }
    );
    await staking.deployed();

    // Create our fee distributor
    feeDistributor = await upgrades.deployProxy(
      feeDistributorFactory,
      [],
      {
        initializer: "__MockDistributor_init",
      }
    );
    await feeDistributor.deployed();

    // Set up an empty vault contract for referencing in NFTX Vault Factory
    const Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    vault = await Vault.deploy();
    await vault.deployed();

    // Create our NFTX vault factory
    nftx = await upgrades.deployProxy(
      nftxVaultFactoryFactory,
      [vault.address, feeDistributor.address],
      {
        initializer: "__NFTXVaultFactory_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await nftx.deployed();

    // Create our inventory staking
    inventoryStaking = await upgrades.deployProxy(
      inventoryStakingFactory,
      [nftx.address],
      {
        initializer: "__NFTXInventoryStaking_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await inventoryStaking.deployed();

    vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");

    // Configure our fee distributor
    await feeDistributor.connect(primary).setNFTXVaultFactory(nftx.address);
    await feeDistributor.connect(primary).setInventoryStakingAddress(inventoryStaking.address);
    await staking.connect(primary).setNFTXVaultFactory(nftx.address);

    // Set up an ERC721 token
    cryptopunk = await erc721Factory.deploy('CryptoPunk', 'PUNK')
    tubbycat = await erc721Factory.deploy('Tubby Cats', 'TUBBY')

    // Set up an ERC1155 token
    multiToken = await erc1155Factory.deploy('https://multi.token')

    // Create our NFTX vault for cryptopunks
    const response = await nftx.createVault("CryptoPunk", "PUNK", cryptopunk.address, false, true);
    const vaultAddr = await nftx.vault(0);

    // Build our vault contract object form the address and artifact
    punkVault = new ethers.Contract(vaultAddr, vaultArtifact.abi, ethers.provider);

    // Create our NFTX vault for Tubby cats
    const tubbyResponse = await nftx.createVault("Tubby Cats", "TUBBY", tubbycat.address, false, true);
    const tubbyVaultAddr = await nftx.vault(1);

    // Build our vault contract object form the address and artifact
    tubbyVault = new ethers.Contract(tubbyVaultAddr, vaultArtifact.abi, ethers.provider);

    // Create our NFTX vault for Tubby cats
    const multiTokenResponse = await nftx.createVault("MultiToken", "MULTI", multiToken.address, true, true);
    const multiTokenAddr = await nftx.vault(2);

    // Build our vault contract object form the address and artifact
    multiTokenVault = new ethers.Contract(multiTokenAddr, vaultArtifact.abi, ethers.provider);

    // Set up our NFTX vault listings contract
    nftxVaultListing = await upgrades.deployProxy(
      nftxVaultListingFactory,
      [],
      {
        initializer: "__NFTXVaultListing_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await nftxVaultListing.deployed();

    // Give alice tokens 1 - 10 inclusive and approve them all to be handled by our vault
    for (let i = 1; i <= 10; ++i) {
      await cryptopunk.publicMint(alice.address, i);
      await tubbycat.publicMint(alice.address, i);
      await multiToken.publicMint(alice.address, i, 10);
    }
    await cryptopunk.connect(alice).setApprovalForAll(punkVault.address, true)
    await tubbycat.connect(alice).setApprovalForAll(tubbyVault.address, true)
    await multiToken.connect(alice).setApprovalForAll(multiTokenVault.address, true)

    // Give bob tokens 11 - 15 inclusive and approve them all to be handled by our vault
    for (let i = 11; i <= 15; ++i) {
      await cryptopunk.publicMint(bob.address, i);
      await tubbycat.publicMint(bob.address, i);
      await multiToken.publicMint(bob.address, i, 10);
    }
    await cryptopunk.connect(bob).setApprovalForAll(punkVault.address, true)
    await tubbycat.connect(bob).setApprovalForAll(tubbyVault.address, true)
    await multiToken.connect(bob).setApprovalForAll(multiTokenVault.address, true)
  })

  beforeEach(async () => {
    // Reset our NFTX Vault Listing contract variables back to expected default
    await nftxVaultListing.setFloorPrice(validFloorPrice)
  });

  describe('createListings', async () => {

    /**
     * GENERIC AND 721 LISTING CREATION TESTS
     */

    it('Should be able to create listing', async () => {
      // Approve our NFT on the NFTX Vault Listing contract
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      // Create our listing
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get our listing ID from the vault address and NFT ID that was listed
      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)

      // Now that we have the listing ID we can get the NFT listing data
      listing = await nftxVaultListing.listings721(listingId)

      // Confirm that we can extract the expected data from the listing. The vault
      // and NFT ID is already inferred from the generation of the listing ID and stored
      // on the subgraph, so that is not stored inside the structure.
      expect(listing.seller, alice.address)
      expect(listing.price, validFloorPrice)
      expect(listing.expiryTime, futureTimestamp)
      expect(listing.settings, 0)
    })

    it('Should emit event for created listings', async () => {
      // TODO
    })

    it('Should prevent prices under 1.2 being listed', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['0'], [0], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000'], [0], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')
    })

    it('Should allow min floor price to be modified', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000'], [0], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')

      await nftxVaultListing.setFloorPrice('1190000')

      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000'], [0], [futureTimestamp]
      )
    })

    it('Should only allow the owner to set floor price', async () => {
      // The owner can set the price correctly
      await nftxVaultListing.setFloorPrice('1190000')

      // A non-owner user will be reverted
      await expect(
        nftxVaultListing.connect(alice).setFloorPrice('1000000')
      ).to.be.revertedWith('Ownable: caller is not the owner')
    });

    it('Should prevent expired listings being created', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [0], [0], [0]
      )).to.be.revertedWith('Listing already expired')
    })

    it('Should prevent unowned NFT listings being created', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(bob).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )).to.be.revertedWith('Sender does not own NFT')
    })

    it('Should prevent unapproved listings being created', async () => {
      await expect(nftxVaultListing.connect(alice).createListings(
        [9], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )).to.be.revertedWith('Sender has not approved NFT')
    })

    it('Should be able to create multiple listings in a single call', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      await tubbycat.connect(alice).approve(nftxVaultListing.address, 3);

      // Create 3 listings from alice
      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 3],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [0, 0, 0],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId)
      expect(listing.seller, alice.address)
      expect(listing.price, validFloorPrice)
      expect(listing.expiryTime, futureTimestamp)
      expect(listing.settings, 0)

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 2)
      listing = await nftxVaultListing.listings721(listingId);
      expect(listing.seller, alice.address)
      expect(listing.price, validFloorPrice)
      expect(listing.expiryTime, futureTimestamp)
      expect(listing.settings, 0)

      listingId = await nftxVaultListing.getListingId721(tubbyVault.address, 3)
      listing = await nftxVaultListing.listings721(listingId);
      expect(listing.seller, alice.address)
      expect(listing.price, validFloorPrice)
      expect(listing.expiryTime, futureTimestamp)
      expect(listing.settings, 0)
    })

    it('Should not be able to create a listing in the wrong vault', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [tubbyVault.address], [validFloorPrice], [0], [futureTimestamp]
      )).to.be.revertedWith('Sender has not approved NFT')
    })

    it('Should revert with failed listing(s) amongst successful', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      await tubbycat.connect(alice).approve(nftxVaultListing.address, 3);
      await cryptopunk.connect(bob).approve(nftxVaultListing.address, 11);

      await expect(
        nftxVaultListing.connect(alice).createListings(
          [1, 2, 3, 11],
          [punkVault.address, punkVault.address, tubbyVault.address, punkVault.address],
          [validFloorPrice, 0, validFloorPrice, validFloorPrice],
          [0, 0, 0, 0],
          [0, futureTimestamp, futureTimestamp, futureTimestamp]
        )
      ).to.be.reverted
    })


    /**
     * CROSS LISTING STANDARD CREATION TESTS
     */

    xit('Should not allow an ERC721 to be created as an ERC1155 listing', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      // Create 3 listings from alice
      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [2], [futureTimestamp]
      )).to.be.revertedWith('Invalid token submitted to vault')
    })

    xit('Should not allow an ERC1155 to be created as an ERC721 listing', async () => {
      multiToken.connect(alice).setApprovalForAll(nftxVaultListing.address, true);

      // Create 3 listings from alice
      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [multiTokenVault.address], [validFloorPrice], [0], [futureTimestamp]
      )).to.be.revertedWith('Invalid token submitted to vault')
    })


    /**
     * ERC1155 SPECIFIC TESTS
     */

    xit('Should be able to create an ERC1155 listing', async () => {
      multiToken.connect(alice).setApprovalForAll(nftxVaultListing.address, true);

      // Create 3 listings from alice
      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 1],
        [multiTokenVault.address, multiTokenVault.address, multiTokenVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [2, 1, 3],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      listings = await nftxVaultListing.getListings([])
      expect(listings.length).to.equal(3)
    })

  })

  describe('updateListings', async () => {

    it('Should be able to delete a listing by setting an expiry time of 0', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Set the listing to be expired
      await nftxVaultListing.connect(alice).updateListings(
        [1],                  // nftIds
        [punkVault.address],  // vaults
        [listingId],          // listingIds
        [validFloorPrice],    // prices
        [futureTimestamp],    // expiries
        [0]                   // amounts
      )

      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 0);
      expect(listing.seller, alice.address);
    })

    it('Should be able to update price', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.price, validFloorPrice);

      // Set the listing to be expired
      await nftxVaultListing.connect(alice).updateListings(
        [1],                     // nftIds
        [punkVault.address],     // vaults
        [listingId],             // listingIds
        [aboveValidFloorPrice],  // prices
        [futureTimestamp],       // expiries
        [0]                      // amounts
      )

      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.price, aboveValidFloorPrice);
      expect(listing.active, true);
    })

    it('Should not allow user to update price below floor', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.price, validFloorPrice);

      // Set the listing to be expired
      await expect(nftxVaultListing.connect(alice).updateListings(
        [1],                     // nftIds
        [punkVault.address],     // vaults
        [listingId],             // listingIds
        [belowValidFloorPrice],  // prices
        [futureTimestamp],       // expiries
        [0]                      // amounts
      )).to.be.revertedWith('Listing below floor price')
    })

    it('Should not allow expiry update if price is below minimum', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.price, validFloorPrice);
      expect(listing.expiry, futureTimestamp);

      await nftxVaultListing.setFloorPrice(aboveValidFloorPrice)

      // Update the expiry timestamp but leave the floor price as it was before
      await expect(nftxVaultListing.connect(alice).updateListings(
        [1],                       // nftIds
        [punkVault.address],       // vaults
        [listingId],               // listingIds
        [validFloorPrice],         // prices
        [anotherFutureTimestamp],  // expiries
        [0]                        // amounts
      )).to.be.revertedWith('Listing below floor price')

      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.price, validFloorPrice);
      expect(listing.expiry, futureTimestamp);
    });

    it('Should be able to deactivate a listing by setting a past expiry time', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Set the listing to be expired
      await nftxVaultListing.connect(alice).updateListings(
        [1],                  // nftIds
        [punkVault.address],  // vaults
        [listingId],          // listingIds
        [validFloorPrice],    // prices
        [1],                  // expiries
        [0]                   // amounts
      )

      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 1);
      expect(listing.seller, alice.address);
    })

    it('Should prevent non-seller from updating listing', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.seller, alice.address);

      await expect(nftxVaultListing.connect(bob).updateListings(
        [1],                  // nftIds
        [punkVault.address],  // vaults
        [listingId],          // listingIds
        [validFloorPrice],    // prices
        [1],                  // expiries
        [0]                   // amounts
      )).to.be.revertedWith('Sender is not listing owner')
    })

    it('Should update multiple listings', async () => {
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      await tubbycat.connect(alice).approve(nftxVaultListing.address, 1);

      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 1],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [0, 0, 0],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      listingId1 = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId1);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      listingId2 = await nftxVaultListing.getListingId721(punkVault.address, 2)
      listing = await nftxVaultListing.listings721(listingId2);

      expect(listing.id, 1);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 2);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      listingId3 = await nftxVaultListing.getListingId721(tubbyVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId3);

      expect(listing.id, 2);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Set one listing to expired and one to deleted
      await nftxVaultListing.connect(alice).updateListings(
        [1, 2, 1],                                                   // nftIds
        [punkVault.address, punkVault.address, tubbyVault.address],  // vaults
        [listingId1, listingId2, listingId3],                        // listingIds
        [validFloorPrice, validFloorPrice, validFloorPrice],         // prices
        [1, anotherFutureTimestamp, 0],                              // expiries
        [0, 0, 0]                                                    // amounts
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 1);
      expect(listing.seller, alice.address);

      listingId = await nftxVaultListing.getListingId721(punkVault.address, 2)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 1);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 2);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, anotherFutureTimestamp);
      expect(listing.seller, alice.address);

      listingId = await nftxVaultListing.getListingId721(tubbyVault.address, 1)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 2);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 0);
      expect(listing.seller, alice.address);
    })

  })

  describe('fillListings', async () => {

    /**
     * We use this function to ensure that each test has the ability for the Whale
     * user to transfer enough tokens for one or more valid price transactions.
     */

    async function generateWhaleTokens(count = 10) {
      whaleNftIdList = []
      erc1155Quantities = []

      // Create a whale user that can distribute vault tokens
      for (let i = whaleNftCount; i <= whaleNftCount + count; ++i) {
        await cryptopunk.publicMint(whale.address, i);
        await tubbycat.publicMint(whale.address, i);
        await multiToken.publicMint(whale.address, i, 10);

        whaleNftIdList.push(i)
        erc1155Quantities.push(10)
      }

      // Set our approvals
      await cryptopunk.connect(whale).setApprovalForAll(punkVault.address, true);
      await tubbycat.connect(whale).setApprovalForAll(tubbyVault.address, true);
      await multiToken.connect(whale).setApprovalForAll(multiTokenVault.address, true);

      // Get our ERC721 vault tokens
      await punkVault.connect(whale).mint(whaleNftIdList, []);
      await tubbyVault.connect(whale).mint(whaleNftIdList, []);

      // Get our ERC1155 vault tokens
      await multiTokenVault.connect(whale).mint(whaleNftIdList, erc1155Quantities);

      // Avoid index clashes for next tests that call this method
      whaleNftCount += count + 1
    }

    it('Should be able to fill a listing', async () => {
      await generateWhaleTokens(10)

      testNftId = 4

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')

      // Fill the listing
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')
      await nftxVaultListing.connect(bob).fillListings(
        [testNftId],          // nftIds,
        [punkVault.address],  // vault
        [listingId],          // listingIds
        [0]                   // amounts
      )

      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)
      listing = await nftxVaultListing.listings721(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, testNftId);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.amount, 0);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Confirm that alice no longer owns the NFT, but bob does
      expect(await cryptopunk.ownerOf(testNftId)).to.equal(bob.address);

      // Confirm bob can now list the NFT after re-approving
      await cryptopunk.connect(bob).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(bob).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Confirm that bob's token balance has been reduced by the listing price
      expect(await punkVault.balanceOf(bob.address)).to.equal('3800000000000000000')

      // Confirm alice holds the expected price of tokens
      expect(await punkVault.balanceOf(alice.address)).to.equal('1200000000000000000')
    })

    it('Should prevent fill if sender has insuffient balance for a listing', async () => {
      await generateWhaleTokens(10)

      testNftId = 5

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Give bob insufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '1000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '1000000000000000000')

      await expect(
        nftxVaultListing.connect(bob).fillListings([testNftId], [punkVault.address], [listingId], [0])
      ).to.be.reverted
    })

    it('Should prevent an inactive listing from being filled', async () => {
      await generateWhaleTokens(10)

      testNftId = 6

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Set the listing to be inactive. We set it to a past timestamp here, rather than
      // to 0 as that would delete the listing, rather than just expiring it.
      await nftxVaultListing.connect(alice).updateListings(
        [testNftId], [punkVault.address], [listingId], [validFloorPrice], [0], [0]
      )

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled
      await expect(
        nftxVaultListing.connect(bob).fillListings([testNftId], [punkVault.address], [listingId], [0])
      ).to.be.revertedWith('Listing ID does not exist')
    })

    it('Should prevent an expired listing from being filled', async () => {
      await generateWhaleTokens(10)

      testNftId = 7

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Set the listing to be inactive
      await nftxVaultListing.connect(alice).updateListings(
        [testNftId], [punkVault.address], [listingId], [validFloorPrice], [1], [0]
      )

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled
      await expect(
        nftxVaultListing.connect(bob).fillListings([testNftId], [punkVault.address], [listingId], [0])
      ).to.be.revertedWith('Listing has expired')
    })

    it('Should prevent the seller from filling their own listing', async () => {
      await generateWhaleTokens(10)

      testNftId = 8

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Give alice sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(alice.address, '5000000000000000000')
      await punkVault.connect(alice).approve(nftxVaultListing.address, '5000000000000000000')

      await expect(
        nftxVaultListing.connect(alice).fillListings([testNftId], [punkVault.address], [listingId], [0])
      ).to.be.revertedWith('Buyer cannot be seller')
    })

    it('Should prevent an listing from being filled if seller has externally transferred NFT', async () => {
      await generateWhaleTokens(10)

      testNftId = 9

      await cryptopunk.connect(alice).approve(nftxVaultListing.address, testNftId);
      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [punkVault.address], [validFloorPrice], [0], [futureTimestamp]
      )

      // Get the listing ID that we created
      listingId = await nftxVaultListing.getListingId721(punkVault.address, testNftId)

      // Transfer the NFT from alice to carol
      await cryptopunk.connect(alice).transferFrom(alice.address, carol.address, testNftId)

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled as alice no longer owns the NFT
      await expect(
        nftxVaultListing.connect(bob).fillListings([testNftId], [punkVault.address], [listingId], [0])
      ).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
    })

    xit('Should allow multiple ERC1155 tokens to be purchased from a listing', async () => {
      await generateWhaleTokens(10)

      testNftId = 10

      await multiToken.connect(alice).setApprovalForAll(nftxVaultListing.address, true);

      await nftxVaultListing.connect(alice).createListings(
        [testNftId], [multiTokenVault.address], [validFloorPrice], [3], [futureTimestamp]
      )

      listingId = await nftxVaultListing.getListingId1155(multiTokenVault.address, testNftId)
      listing = await nftxVaultListing.listings1155(listingId);

      expect(listing.id, 0);
      expect(listing.vaultId, multiTokenVault.id);
      expect(listing.vaultAddress, multiTokenVault.address);
      expect(listing.nftId, testNftId);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.amount, 3);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Give bob sufficient tokens to fill the listing
      await multiTokenVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await multiTokenVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      await nftxVaultListing.connect(bob).fillListings([testNftId], [multiTokenVault.address], [listingId], [2]);

      expect(await multiTokenVault.balanceOf(alice.address)).to.equal('2400000000000000000')
      expect(await multiTokenVault.balanceOf(bob.address)).to.equal('2600000000000000000')

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.active, true);
      expect(listing.amount, 1);

      await expect(
        nftxVaultListing.connect(bob).fillListings([1], [multiTokenVault.address], [listingId], [2])
      ).to.be.revertedWith('Insufficient tokens in listing');

      await nftxVaultListing.connect(bob).fillListings([1], [multiTokenVault.address], [listingId], [1]);

      expect(await multiTokenVault.balanceOf(alice.address)).to.equal('3600000000000000000')
      expect(await multiTokenVault.balanceOf(bob.address)).to.equal('1400000000000000000')

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.active, false);
      expect(listing.amount, 0);
    })

  })

})
