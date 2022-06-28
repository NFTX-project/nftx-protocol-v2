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

      await vaultCreationZap.createVault(
        // Vault creation
        'Space Poggers',
        'POGGERS',
        '0x4a8B01E437C65FA8612e8b699266c0e0a98FF65c',
        false,
        true,

        // Vault features
        ethers.utils.hexZeroPad(ethers.utils.hexlify([1, 0, 1, 0, 1]), 32),
    
        // Fee assignment
        ethers.utils.hexZeroPad(ethers.utils.hexlify([1, 1, 1, 1, 1]), 32),
    
        // Eligibility storage
        0,
        0,

        // Mint and stake
      );

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
