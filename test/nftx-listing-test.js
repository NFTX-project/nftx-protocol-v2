const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

let feeDistributorFactory, feeDistributor;
let inventoryStakingFactory, inventoryStaking;
let nftxVaultUpgragableFactory, nftxVault;
let nftxVaultListingFactory, nftxVaultListing;
let nftxVaultFactoryFactory, nftxVaultFactory;
let erc721Factory, vault, punkVault, tubbyVault;

let alice, bob, carol;

const validFloorPrice = "1200000000000000000";
const futureTimestamp = "999999999999";

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";


describe('NFTX Vault Listings', async () => {

  before(async () => {
    feeDistributorFactory = await ethers.getContractFactory("MockDistributor");
    liquidityStakingFactory = await ethers.getContractFactory("NFTXLPStaking");
    inventoryStakingFactory = await ethers.getContractFactory("NFTXInventoryStaking")
    nftxVaultListingFactory = await ethers.getContractFactory("NFTXVaultListingUpgradeable")
    nftxVaultFactoryFactory = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable")
    erc721Factory = await ethers.getContractFactory("ERC721")
  })

  beforeEach(async () => {
    // Set up our test users
    [primary, alice, bob, carol, whale, ...users] = await ethers.getSigners()

    // Set up an ERC721 token
    cryptopunk = await erc721Factory.deploy('CryptoPunk', 'PUNK')
    tubbycat = await erc721Factory.deploy('Tubby Cats', 'TUBBY')

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
    const feeDistributor = await upgrades.deployProxy(
      feeDistributorFactory,
      [],
      {
        initializer: "__MockDistributor_init",
      }
    );
    await feeDistributor.deployed();

    // Set up an empty vault contract for referencing in NFTX Vault Factory
    const Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    const vault = await Vault.deploy();
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

    const vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");

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

    // Configure our fee distributor
    await feeDistributor.connect(primary).setNFTXVaultFactory(nftx.address);
    await feeDistributor.connect(primary).setInventoryStakingAddress(inventoryStaking.address);
    await staking.connect(primary).setNFTXVaultFactory(nftx.address);

    // Set up our NFTX vault listings contract
    nftxVaultListing = await upgrades.deployProxy(
      nftxVaultListingFactory,
      [nftx.address],
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
    }
    await cryptopunk.connect(alice).setApprovalForAll(punkVault.address, true)
    await tubbycat.connect(alice).setApprovalForAll(tubbyVault.address, true)

    // Give bob tokens 11 - 15 inclusive and approve them all to be handled by our vault
    for (let i = 11; i <= 15; ++i) {
      await cryptopunk.publicMint(bob.address, i);
      await tubbycat.publicMint(bob.address, i);
    }
    await cryptopunk.connect(bob).setApprovalForAll(punkVault.address, true)
    await tubbycat.connect(bob).setApprovalForAll(tubbyVault.address, true)

    // Create a whale user that can distribute vault tokens
    for (let i = 16; i <= 25; ++i) {
      await cryptopunk.publicMint(whale.address, i);
      await tubbycat.publicMint(whale.address, i);
    }

    await cryptopunk.connect(whale).setApprovalForAll(punkVault.address, true);
    await tubbycat.connect(whale).setApprovalForAll(tubbyVault.address, true);

    await punkVault.connect(whale).mint([16, 17, 18, 19, 20, 21, 22, 23, 24, 25], []);
    await tubbyVault.connect(whale).mint([16, 17, 18, 19, 20, 21, 22, 23, 24, 25], []);
  })

  describe('getListings', async () => {

    it('Should be able to retrieve all listings', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      tubbycat.connect(alice).approve(nftxVaultListing.address, 3);

      // Create 3 listings from alice
      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 3],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      cryptopunk.connect(bob).approve(nftxVaultListing.address, 11);

      // Create 1 listing for bob
      await nftxVaultListing.connect(bob).createListings(
        [11],
        [punkVault.address],
        [validFloorPrice],
        [futureTimestamp]
      )

      listings = await nftxVaultListing.getListings([])
      expect(listings.length).to.equal(4)
    })

    it('Should be able to retrieve specified listings', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      tubbycat.connect(alice).approve(nftxVaultListing.address, 3);

      // Create 3 listings from alice
      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 3],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      cryptopunk.connect(bob).approve(nftxVaultListing.address, 11);

      // Create 1 listing for bob
      await nftxVaultListing.connect(bob).createListings(
        [11],
        [punkVault.address],
        [validFloorPrice],
        [futureTimestamp]
      )

      punkListings = await nftxVaultListing.getListings([punkVault.address])
      expect(punkListings.length).to.equal(3)

      tubbyListings = await nftxVaultListing.getListings([tubbyVault.address])
      expect(tubbyListings.length).to.equal(1)

      bothListings = await nftxVaultListing.getListings([punkVault.address, tubbyVault.address])
      expect(bothListings.length).to.equal(4)
    })

    it('Should be able to request listings from unknown vault', async () => {
      unknownListings = await nftxVaultListing.getListings([notZeroAddr])
      expect(unknownListings.length).to.equal(0)
    })

    it('Should gracefully handle no listings being present when retrieving all listings', async () => {
      noListings = await nftxVaultListing.getListings([])
      expect(noListings.length).to.equal(0)
    })

    it('Should gracefully handle no listings being present when retrieving specified listings', async () => {
      emptyVaultListings = await nftxVaultListing.getListings([punkVault.address, tubbyVault.address])
      expect(emptyVaultListings.length).to.equal(0)
    })

  })

  describe('createListings', async () => {

    it('Should be able to create listing', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);
    })

    it('Should prevent prices under 1.2 being listed', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['0'], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000000000000000'], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')
    })

    it('Should allow min floor price to be modified', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000000000000000'], [futureTimestamp]
      )).to.be.revertedWith('Listing below floor price')

      await nftxVaultListing.setFloorPrice('1190000000000000000')

      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], ['1190000000000000000'], [futureTimestamp]
      )
    })

    it('Should prevent expired listings being created', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [0], [0]
      )).to.be.revertedWith('Listing already expired')
    })

    it('Should prevent unowned NFT listings being created', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(bob).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )).to.be.revertedWith('Sender does not own NFT')
    })

    it('Should prevent unapproved listings being created', async () => {
      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )).to.be.revertedWith('Sender has not approved NFT')
    })

    it('Should be able to create multiple listings in a single call', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      tubbycat.connect(alice).approve(nftxVaultListing.address, 3);

      // Create 3 listings from alice
      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 3],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);
      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);

      listing = await nftxVaultListing.listings(1);
      expect(listing.id, 1);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 2);

      listing = await nftxVaultListing.listings(2);
      expect(listing.id, 2);
      expect(listing.vaultId, tubbyVault.id);
      expect(listing.vaultAddress, tubbyVault.address);
      expect(listing.nftId, 3);
    })

    it('Should not be able to create a listing in the wrong vault', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);

      await expect(nftxVaultListing.connect(alice).createListings(
        [1], [tubbyVault.address], [validFloorPrice], [futureTimestamp]
      )).to.be.revertedWith('Sender has not approved NFT')
    })

    it('Should revert with failed listing(s) amongst successful', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      tubbycat.connect(alice).approve(nftxVaultListing.address, 3);
      cryptopunk.connect(bob).approve(nftxVaultListing.address, 11);

      await expect(
        nftxVaultListing.connect(alice).createListings(
          [1, 2, 3, 11],
          [punkVault.address, punkVault.address, tubbyVault.address, punkVault.address],
          [validFloorPrice, 0, validFloorPrice, validFloorPrice],
          [0, futureTimestamp, futureTimestamp, futureTimestamp]
        )
      ).to.be.reverted
    })

  })

  describe('updateListings', async () => {

    it('Should be able to delete a listing by setting an expiry time of 0', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);

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
        [1], [punkVault.address], [0]
      )

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 0);
      expect(listing.seller, alice.address);
    })

    it('Should be able to deactivate a listing by setting a past expiry time', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);

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
        [1], [punkVault.address], [1]
      )

      listing = await nftxVaultListing.listings(0);

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
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.seller, alice.address);

      await expect(nftxVaultListing.connect(bob).updateListings(
        [1], [punkVault.address], [1]
      )).to.be.revertedWith('Sender is not listing owner')
    })

    it('Should update multiple listings', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 2);
      tubbycat.connect(alice).approve(nftxVaultListing.address, 1);

      await nftxVaultListing.connect(alice).createListings(
        [1, 2, 1],
        [punkVault.address, punkVault.address, tubbyVault.address],
        [validFloorPrice, validFloorPrice, validFloorPrice],
        [futureTimestamp, futureTimestamp, futureTimestamp]
      )

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      listing = await nftxVaultListing.listings(1);

      expect(listing.id, 1);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 2);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      listing = await nftxVaultListing.listings(2);

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
        [1, 2, 1], [punkVault.address, punkVault.address, tubbyVault.address], [1, futureTimestamp + 10, 0]
      )

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, 1);
      expect(listing.seller, alice.address);

      listing = await nftxVaultListing.listings(1);

      expect(listing.id, 1);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 2);
      expect(listing.price, validFloorPrice);
      expect(listing.active, true);
      expect(listing.expiry, futureTimestamp + 10);
      expect(listing.seller, alice.address);

      listing = await nftxVaultListing.listings(2);

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

    it('Should be able to fill a listing', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')

      // Fill the listing
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')
      await nftxVaultListing.connect(bob).fillListings([1], [punkVault.address])

      listing = await nftxVaultListing.listings(0);

      expect(listing.id, 0);
      expect(listing.vaultId, punkVault.id);
      expect(listing.vaultAddress, punkVault.address);
      expect(listing.nftId, 1);
      expect(listing.price, validFloorPrice);
      expect(listing.active, false);
      expect(listing.expiry, futureTimestamp);
      expect(listing.seller, alice.address);

      // Confirm that alice no longer owns the NFT, but bob does
      expect(await cryptopunk.ownerOf(1)).to.equal(bob.address);

      // Confirm bob can now list the NFT after re-approving
      cryptopunk.connect(bob).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(bob).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Confirm that bob's token balance has been reduced by the listing price
      expect(await punkVault.balanceOf(bob.address)).to.equal('3800000000000000000')

      // Confirm alice holds the expected price of tokens
      expect(await punkVault.balanceOf(alice.address)).to.equal('1200000000000000000')
    })

    it('Should prevent fill if sender has insuffient balance for a listing', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Give bob insufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '1000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '1000000000000000000')

      await expect(
        nftxVaultListing.connect(bob).fillListings([1], [punkVault.address])
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })

    it('Should prevent an inactive listing from being filled', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Set the listing to be inactive
      await nftxVaultListing.connect(alice).updateListings(
        [1], [punkVault.address], [0]
      )

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled
      await expect(
        nftxVaultListing.connect(bob).fillListings([1], [punkVault.address])
      ).to.be.revertedWith('Listing is not active')
    })

    it('Should prevent an expired listing from being filled', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Set the listing to be inactive
      await nftxVaultListing.connect(alice).updateListings(
        [1], [punkVault.address], [1]
      )

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled
      await expect(
        nftxVaultListing.connect(bob).fillListings([1], [punkVault.address])
      ).to.be.revertedWith('Listing is not active')
    })

    it('Should prevent the seller from filling their own listing', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Give alice sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(alice.address, '5000000000000000000')
      await punkVault.connect(alice).approve(nftxVaultListing.address, '5000000000000000000')

      await expect(
        nftxVaultListing.connect(alice).fillListings([1], [punkVault.address])
      ).to.be.revertedWith('Buyer cannot be seller')
    })

    it('Should prevent an listing from being filled if seller has externally transferred NFT', async () => {
      cryptopunk.connect(alice).approve(nftxVaultListing.address, 1);
      await nftxVaultListing.connect(alice).createListings(
        [1], [punkVault.address], [validFloorPrice], [futureTimestamp]
      )

      // Transfer the NFT from alice to carol
      cryptopunk.connect(alice).transferFrom(alice.address, carol.address, 1)

      // Give bob sufficient tokens to fill the listing
      await punkVault.connect(whale).transfer(bob.address, '5000000000000000000')
      await punkVault.connect(bob).approve(nftxVaultListing.address, '5000000000000000000')

      // Confirm that the listing cannot be filled as alice no longer owns the NFT
      await expect(
        nftxVaultListing.connect(bob).fillListings([1], [punkVault.address])
      ).to.be.revertedWith('ERC721: transfer caller is not owner nor approved')
    })

  })

})
