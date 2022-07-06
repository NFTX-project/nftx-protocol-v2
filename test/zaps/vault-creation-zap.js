const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;


// Store our internal contract references
let weth, erc721, erc1155;
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

    // Set up a test ERC1155 token
    const Erc1155 = await ethers.getContractFactory("ERC1155");
    erc1155 = await Erc1155.deploy('https://space.poggers/');
    await erc1155.deployed();

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

    it("Should allow 721 vault to be created in a single call", async function () {

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
        21,  // 10101
    
        // Fee assignment
        {
          mintFee: 10000000,           // 0.1
          randomRedeemFee: 5000000,    // 0.05
          targetRedeemFee: 10000000,   // 0.1
          randomSwapFee: 5000000,      // 0.05
          targetSwapFee: 10000000      // 0.1
        },
    
        // Eligibility storage
        {
          moduleIndex: 0,
          initData: 0
        },

        // Mint and stake
        {
          assetTokenIds: [1, 2, 3, 4],
          assetTokenAmounts: [1, 1, 1, 1]
        }
      );

      // Build our NFTXVaultUpgradeable against the newly created vault
      const newVault = await ethers.getContractAt(
        "NFTXVaultUpgradeable",
        await nftx.vault(0)
      );

      // Confirm our general information
      expect(await newVault.vaultId()).to.equal(0);
      expect(await newVault.name()).to.equal('Space Poggers');
      expect(await newVault.symbol()).to.equal('POGGERS');
      expect(await newVault.assetAddress()).to.equal(erc721.address);

      // Confirm our features
      expect(await newVault.enableMint()).to.equal(true);
      expect(await newVault.enableRandomRedeem()).to.equal(false);
      expect(await newVault.enableTargetRedeem()).to.equal(true);
      expect(await newVault.enableRandomSwap()).to.equal(false);
      expect(await newVault.enableTargetSwap()).to.equal(true);

      // Confirm our fees
      let [mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee] = await newVault.vaultFees();

      expect(mintFee).to.equal("100000000000000000");
      expect(randomRedeemFee).to.equal("50000000000000000");
      expect(targetRedeemFee).to.equal("100000000000000000");
      expect(randomSwapFee).to.equal("50000000000000000");
      expect(targetSwapFee).to.equal("100000000000000000");

      // Confirm our vault's token holdings
      expect(await erc721.balanceOf(newVault.address)).to.equal(4);
    });


    /**
     * Confirm that a vault can be created when providing all possible options.
     */

    it("Should allow 1155 vault to be created in a single call", async function () {

      // Mint 10x the vault asset address to Alice (10 tokens)
      for (let i = 0; i < 10; ++i) {
        await erc1155.publicMint(alice.address, i, 10);
      }

      // Approve the Vault Creation Zap to use Alice's ERC1155s
      await erc1155.connect(alice).setApprovalForAll(vaultCreationZap.address, true);

      // Use call static to get the actual return vault from the call
      const vaultId = await vaultCreationZap.connect(alice).createVault(
        // Vault creation
        {
          name: 'Pace Spoggers',
          symbol: 'SPOGGERS',
          assetAddress: erc1155.address,
          is1155: true,
          allowAllItems: true
        },

        // Vault features
        26,  // 11010
    
        // Fee assignment
        {
          mintFee: 20000000,           // 0.2
          randomRedeemFee: 12500000,    // 0.125
          targetRedeemFee: 20000000,   // 0.2
          randomSwapFee: 15000000,      // 0.15
          targetSwapFee: 20000000      // 0.2
        },
    
        // Eligibility storage
        {
          moduleIndex: 0,
          initData: 0
        },

        // Mint and stake
        {
          assetTokenIds: [1, 2, 3],
          assetTokenAmounts: [2, 5, 3]
        }
      );

      // Build our NFTXVaultUpgradeable against the newly created vault
      const newVault = await ethers.getContractAt(
        "NFTXVaultUpgradeable",
        await nftx.vault(1)
      );

      // Confirm our general information
      expect(await newVault.vaultId()).to.equal(1);
      expect(await newVault.name()).to.equal('Pace Spoggers');
      expect(await newVault.symbol()).to.equal('SPOGGERS');
      expect(await newVault.assetAddress()).to.equal(erc1155.address);

      // Confirm our features
      expect(await newVault.enableMint()).to.equal(true);
      expect(await newVault.enableRandomRedeem()).to.equal(true);
      expect(await newVault.enableTargetRedeem()).to.equal(false);
      expect(await newVault.enableRandomSwap()).to.equal(true);
      expect(await newVault.enableTargetSwap()).to.equal(false);

      // Confirm our fees
      let [mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee] = await newVault.vaultFees();

      expect(mintFee).to.equal("200000000000000000");
      expect(randomRedeemFee).to.equal("125000000000000000");
      expect(targetRedeemFee).to.equal("200000000000000000");
      expect(randomSwapFee).to.equal("150000000000000000");
      expect(targetSwapFee).to.equal("200000000000000000");

      // Confirm our vault's token holdings
      expect(await erc1155.balanceOf(newVault.address, 1)).to.equal(2);
      expect(await erc1155.balanceOf(newVault.address, 2)).to.equal(5);
      expect(await erc1155.balanceOf(newVault.address, 3)).to.equal(3);
      expect(await erc1155.balanceOf(newVault.address, 4)).to.equal(0);
    });

  });

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
