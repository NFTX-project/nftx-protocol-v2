const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;


// Store our internal contract references
let payoutToken, erc721;
let nftx, vault, staking, vaultId;
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

    // Set up a test ERC20 token to simulate WETH
    const Erc20 = await ethers.getContractFactory("MockERC20");
    payoutToken = await Erc20.deploy();
    await payoutToken.deployed();

    // Set up a test ERC721 token
    const Erc721 = await ethers.getContractFactory("ERC721");
    erc721 = await Erc721.deploy('SpacePoggers', 'POGGERS');
    await erc721.deployed();

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
    marketplaceZap = await MarketplaceZap.deploy(nftx.address, staking.address, payoutToken.address)
    await marketplaceZap.deployed()

    // Mint the vault asset address to Alice (10 tokens)
    for (let i = 0; i < 10; ++i) {
      await erc721.publicMint(alice.address, i);
    }

    // Mint the vault asset address to Bob (5 unapproved tokens)
    for (let i = 10; i < 15; ++i) {
      await erc721.publicMint(bob.address, i);
    }

    expect(await erc721.balanceOf(alice.address)).to.equal(10);
    expect(await erc721.balanceOf(bob.address)).to.equal(5);

    // Approve the Marketplace Zap to use Alice's ERC721s
    await erc721.connect(alice).setApprovalForAll(marketplaceZap.address, true);

    // Set the 0x payout token and amount
    await mock0xProvider.setPayInAmount(String(BASE * 0.9));  // 1 - 10% fees
    await mock0xProvider.setPayOutAmount(String(BASE * 1));   // 1

    // Add payout token liquidity to the 0x pool
    await payoutToken.mint(mock0xProvider.address, String(BASE * 100))
    expect(await payoutToken.balanceOf(mock0xProvider.address)).to.equal(String(BASE * 100))
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
          _create_call_data(        // swapCallData
            alice.address,
            vault.address,
            payoutToken.address
          ),
          NULL_ADDRESS,             // to
          false                     // weth
        )
      ).to.be.revertedWith('Invalid recipient');

      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [1, 2, 3],                // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            alice.address,
            vault.address,
            payoutToken.address
          ),
          marketplaceZap.address,   // to
          false                     // weth
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
          _create_call_data(        // swapCallData
            alice.address,
            vault.address,
            payoutToken.address
          ),
          alice.address,            // to
          false                     // weth
        )
      ).to.be.revertedWith('Must send IDs');
    });


    /**
     * Confirm that invalid tokens result in tx rejection.
     */

    it("Should not allow unowned or unapproved ERC721s to be sent", async function () {
      // Unowned token
      await expect(
        marketplaceZap.connect(alice).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [11],                     // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            alice.address,
            vault.address,
            payoutToken.address
          ),
          alice.address,            // to
          false                     // weth
        )
      ).to.be.reverted;

      // Unapproved token
      await expect(
        marketplaceZap.connect(bob).mintAndSell721(
          await vault.vaultId(),    // vaultId
          [11],                     // ids
          alice.address,            // spender
          mock0xProvider.address,   // swapTarget
          _create_call_data(        // swapCallData
            alice.address,
            vault.address,
            payoutToken.address
          ),
          bob.address,              // to
          false                     // weth
        )
      ).to.be.reverted;
    });


    /**
     * Confirm that our vault balance is calculated correctly based on the number of IDs provided
     * and the mint fee set on the NFTX vault.
     */

    it("Should correctly return the vault and vault balance", async function () {
      // Currently Alice should be the only owner of the ERC721 tokens
      expect(await erc721.balanceOf(alice.address)).to.equal(10)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(0)

      // Successfully mint and sell 1 token against our zap into the vault
      await marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [1],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          alice.address,
          vault.address,
          payoutToken.address
        ),
        alice.address,            // to
        false                     // weth
      )

      // Alice should have 1 less token than she did before as it has been sold
      // into the vault.
      expect(await erc721.balanceOf(alice.address)).to.equal(9)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(1)

      // Alice should have received ETH from 0x via the zap, but the marketplace
      // zap will not have any as it will have all been sent to Alice.
      expect(await payoutToken.balanceOf(alice.address)).to.equal(String(BASE * 1))
      expect(await payoutToken.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await payoutToken.balanceOf(mock0xProvider.address)).to.equal(String(BASE * 99))
    });


    /**
     * Confirm that a tx can be actioned with another wallet being the recipient.
     */

    it("Should allow sender to purchase on behalf of another wallet", async function () {
      expect(await erc721.balanceOf(alice.address)).to.equal(9)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(1)

      marketplaceZap.connect(alice).mintAndSell721(
        await vault.vaultId(),    // vaultId
        [2],                      // ids
        alice.address,            // spender
        mock0xProvider.address,   // swapTarget
        _create_call_data(        // swapCallData
          bob.address,
          vault.address,
          payoutToken.address
        ),
        bob.address,              // to
        false                     // weth
      )

      // Alice should have 1 less token than she did before as it has been sold
      // into the vault. This is in addition to the 1 already sent from a previous
      // test.
      expect(await erc721.balanceOf(alice.address)).to.equal(8)
      expect(await erc721.balanceOf(marketplaceZap.address)).to.equal(0)
      expect(await erc721.balanceOf(vault.address)).to.equal(2)

      // Alice with have 1 from previous test and bob will now have 1 from this test
      expect(await payoutToken.balanceOf(alice.address)).to.equal(String(BASE * 1))
      expect(await payoutToken.balanceOf(bob.address)).to.equal(String(BASE * 1))
      expect(await payoutToken.balanceOf(mock0xProvider.address)).to.equal(String(BASE * 98))
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

  const NFTXVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const nftxVault = await NFTXVault.deploy();
  await nftxVault.deployed();

  const FeeDistributor = await ethers.getContractFactory(
    "NFTXSimpleFeeDistributor"
  );
  const feeDistrib = await upgrades.deployProxy(
    FeeDistributor,
    [staking.address, payoutToken.address],
    {
      initializer: "__SimpleFeeDistributor__init__",
      unsafeAllow: 'delegatecall'
    }
  );
  await feeDistrib.deployed();

  const Nftx = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
  nftx = await upgrades.deployProxy(
    Nftx,
    [nftxVault.address, feeDistrib.address],
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
  let response = await nftx.createVault(
    'Space Poggers',  // name
    'POGGERS',        // symbol
    erc721.address,   // _assetAddress
    false,            // is1155
    true              // allowAllItems
  );

  const receipt = await response.wait(0);
  const vaultId = receipt.events.find((elem) => elem.event === "NewVault").args[0].toString();
  const vaultAddr = await nftx.vault(vaultId)
  const vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");
  vault = new ethers.Contract(
    vaultAddr,
    vaultArtifact.abi,
    ethers.provider
  );
}

function _create_call_data(spender, tokenIn, tokenOut) {
  let parsedABI = new ethers.utils.Interface(["function transfer(address spender, address tokenIn, address tokenOut)"]);
  return parsedABI.encodeFunctionData('transfer', [spender, tokenIn, tokenOut])
}
