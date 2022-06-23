const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const WETH_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// Store our internal contract references
let nftx, vault, staking;
let marketplaceZap, mock0xProvider;

// Store any user addresses we want to interact with
let deployer, alice, bob, users;


/**
 * Validates our expected NFTX allocator logic.
 */

describe('0x Marketplace Zap', function () {

  /**
   * Confirm that tokens cannot be sent to invalid recipient.
   */

  before(async function () {
    // Set up our deployer / owner address
    [deployer, alice, bob, ...users] = await ethers.getSigners()

    // Set up our NFTX contracts
    await _initialise_nftx_contracts()

    // Set up our 0x mock. Our mock gives us the ability to set a range of parameters
    // against the contract that would normally be out of our control. This allows us
    // to control expected, external proceedures.
    const Mock0xProvider = await ethers.getContractFactory("Mock0xProvider")
    mock0xProvider = await Mock0xProvider.deploy()
    await mock0xProvider.deployed()

    // Set up our NFTX Marketplace 0x Zap
    const MarketplaceZap = await ethers.getContractFactory('NFTXMarketplace0xZap')
    marketplaceZap = await MarketplaceZap.deploy(nftx.address, staking.address, WETH_ADDRESS)
    await marketplaceZap.deployed()
  });


  /**
   * ..
   */

  beforeEach(async function () {
    //
  });


  /**
   * ..
   */

  describe('mintAndSell721', async function () {

    /**
     * Confirm that tokens cannot be sent to invalid recipient.
     */

    it("Should not allow recipient to be NULL address or contract", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          0,                        // swapCallData
          NULL_ADDRESS              // to
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          0,                        // swapCallData
          marketplaceZap.address    // to
        )
      ).to.be.revertedWith('Invalid recipient');
    });


    /**
     * Confirm that >= 1 ID must be requested.
     */

    it("Should require >= 1 token ID", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [],                       // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          0,                        // swapCallData
          alice.address             // to
        )
      ).to.be.revertedWith('Must send IDs');
    });


    /**
     * Confirm that invalid funds result in tx rejection.
     */

    it("Should require user to hold adequate funds", async function () {
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1],                      // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          0,                        // swapCallData
          alice.address             // to
        )
      ).to.be.revertedWith('Insufficient funds');
    });


    /**
     * Confirm that our vault balance is calculated correctly based on the number of IDs provided
     * and the mint fee set on the NFTX vault. This calculation should, at time of writing, be
     * equivalent to:
     * 
     * (length * BASE) - (length * INFTXVault(vault).mintFee())
     */

    it("Should correctly return the vault and vault balance", async function () {
      expect(await vault.balanceOf(alice.address)).to.equal(0)
      expect(await vault.balanceOf(mock0xProvider.address)).to.equal(0)

      marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [1],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        0,                        // swapCallData
        alice.address             // to
      )

      expect(await vault.balanceOf(alice.address)).to.equal(5)
      expect(await vault.balanceOf(mock0xProvider.address)).to.equal(5)
    });


    /**
     * Confirm that a tx can be actioned with another wallet being the recipient.
     */

    it("Should allow sender to purchase on behalf of another wallet", async function () {
      expect(await vault.balanceOf(alice.address)).to.equal(0)
      expect(await vault.balanceOf(bob.address)).to.equal(0)
      expect(await vault.balanceOf(mock0xProvider.address)).to.equal(0)

      marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [1],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        0,                        // swapCallData
        bob.address               // to
      )

      expect(await vault.balanceOf(alice.address)).to.equal(5)
      expect(await vault.balanceOf(bob.address)).to.equal(5)
      expect(await vault.balanceOf(mock0xProvider.address)).to.equal(5)
    });


    /**
     * Confirm that our Sell event is emitted correctly after a successful tx.
     */

    it("Should emit Sell event after success", async function () {
      expect(
        await marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          0,                        // swapCallData
          alice.address             // to
        )
      ).to.emit(marketplaceZap, "Sell").withArgs(3, 0, alice.address);
    });

  })

  describe('buyAndSwap721', async function () {

    /**
     * Confirm that a tx can be made in WETH, rather than the default ETH.
     */

    xit("Should allow for transaction to be sent in WETH", async function () {
      //
    });


    /**
     * Confirm that a tx can be made in WETH, but will fail if the user has an insufficient
     * WETH balance at time of transaction.
     */

    xit("Should allow for transaction to be sent in WETH, but fail with insufficient balance", async function () {
      //
    });

  })

  describe('buyAndRedeem', async function () {
    //
  })

});


async function _initialise_nftx_contracts() {
  const StakingProvider = await ethers.getContractFactory("MockStakingProvider");
  const provider = await StakingProvider.deploy();
  await provider.deployed();

  const Staking = await ethers.getContractFactory("NFTXLPStaking");
  staking = await upgrades.deployProxy(Staking, [provider.address], {
    initializer: "__NFTXLPStaking__init",
    unsafeAllow: 'delegatecall'
  });
  await staking.deployed();

  const Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
  vault = await Vault.deploy();
  await vault.deployed();

  const FeeDistributor = await ethers.getContractFactory(
    "NFTXSimpleFeeDistributor"
  );
  const feeDistrib = await upgrades.deployProxy(
    FeeDistributor,
    [staking.address, WETH_ADDRESS],
    {
      initializer: "__SimpleFeeDistributor__init__",
      unsafeAllow: 'delegatecall'
    }
  );
  await feeDistrib.deployed();

  const Nftx = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
  nftx = await upgrades.deployProxy(
    Nftx,
    [vault.address, feeDistrib.address],
    {
      initializer: "__NFTXVaultFactory_init",
      unsafeAllow: 'delegatecall'
    }
  );
  await nftx.deployed();

  // Connect our contracts to the NFTX Vault Factory
  await feeDistrib.connect(deployer).setNFTXVaultFactory(nftx.address);
  await staking.connect(deployer).setNFTXVaultFactory(nftx.address);

  // Register our NFTX vault that we will use for testing
  await nftx.createVault(
    'Test Vault',   // name
    'TEST',         // symbol
    WETH_ADDRESS,   // _assetAddress
    false,          // is1155
    true            // allowAllItems
  );
}
