const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;


// Store our internal contract references
let weth, erc721;
let nftx, vault, staking, vaultId;
let marketplaceZap, mock0xProvider;

// Store any user addresses we want to interact with
let deployer, alice, bob, users;


/**
 * Validates our expected NFTX allocator logic.
 */

describe('Vault Creation Zap', function () {

  before(async function () {
    // Set up our deployer / owner address
    [deployer, alice, bob, ...users] = await ethers.getSigners()

    // Set up a test ERC721 token
    const Erc721 = await ethers.getContractFactory("ERC721");
    erc721 = await Erc721.deploy('SpacePoggers', 'POGGERS');
    await erc721.deployed();

    // Set up our NFTX contracts
    await _initialise_nftx_contracts()

    // Set up vault creation zap
    const VaultCreationZap = await ethers.getContractFactory("NFTXVaultCreationZap")
    vaultCreationZap = await VaultCreationZap.deploy(nftx.address)
    await vaultCreationZap.deployed()
  });


  /**
   * Test our vault creation flow
   */

  describe('createVault', async function () {

    before(async function () {
      // ..
    });

    /**
     * Confirm that a vault can be created when providing all possible options.
     */

    it("Should allow vault to be created in a single call", async function () {

      // Mint the vault asset address to Alice (10 tokens)
      for (let i = 0; i < 10; ++i) {
        await erc721.publicMint(alice.address, i);
      }

      // Approve the Vault Creation Zap to use Alice's ERC721s
      await erc721.connect(alice).setApprovalForAll(vaultCreationZap.address, true);

      // Use call static to get the actual return vault from the call
      const vaultId = await vaultCreationZap.connect(alice).createVault(
        // Vault creation
        {
          name: 'Space Poggers',
          symbol: 'POGGERS',
          assetAddress: erc721.address,
          is1155: false,
          allowAllItems: true
        },

        // Vault features
        10101,
    
        // Fee assignment
        {mintFee: 1, randomRedeemFee: 2, targetRedeemFee: 3, randomSwapFee: 4, targetSwapFee: 5},
    
        // Eligibility storage
        {moduleIndex: 0, initData: 0},

        // Mint and stake
        {
          assetTokenIds: [1, 2, 3, 4],
          assetTokenAmounts: [1, 1, 1, 1]
        }
      );

      // Build our NFTXVaultUpgradeable against the newly created vault
      // const newVault = await nftx.vault(String(vaultId));
      // console.log(await newVault.vaultId());
      // console.log(await newVault.vaultFees());
      // console.log(await newVault.version());
    });

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

  // Set up a test ERC20 token to simulate WETH
  const WETH = await ethers.getContractFactory("WETH");
  weth = await WETH.deploy();
  await weth.deployed();

  const FeeDistributor = await ethers.getContractFactory(
    "NFTXSimpleFeeDistributor"
  );
  const feeDistrib = await upgrades.deployProxy(
    FeeDistributor,
    [staking.address, weth.address],
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
}
