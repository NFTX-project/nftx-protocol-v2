const { expect } = require("chai");
const { ethers } = require("hardhat");
const {deployMockContract} = require('@ethereum-waffle/mock-contract');

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;


// Store our internal contract references
let weth, erc721, erc1155;
let nftx, vault;
let marketplaceZap, mockSushiSwap;
let inventoryStaking, lpStaking;

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

    // Set up a test ERC20 token to simulate WETH
    const WETH = await ethers.getContractFactory("WETH");
    weth = await WETH.deploy();
    await weth.deployed();

    // Set up a sushiswap mock
    const MockSushiSwap = await ethers.getContractFactory("MockSushiSwap")
    mockSushiSwap = await MockSushiSwap.deploy()
    await mockSushiSwap.deployed()

    // Set up a mocked sushi helper, which will allow us to repoint our liquidity pool
    // token to one that we can control.
    const sushiHelperArtifact = await artifacts.readArtifact("SushiHelper");
    const mockSushiHelper = await deployMockContract(deployer, sushiHelperArtifact.abi);
    await mockSushiHelper.mock.pairFor.returns(weth.address);

    // Set up vault creation zap
    const VaultCreationZap = await ethers.getContractFactory("NFTXVaultCreationZap")
    vaultCreationZap = await VaultCreationZap.deploy(
      nftx.address,
      inventoryStaking.address,
      lpStaking.address,
      mockSushiSwap.address,
      mockSushiHelper.address,
      weth.address,
    )
    await vaultCreationZap.deployed();

    // Allow our yield staking zap to exclude fees
    await nftx.setZapContract(vaultCreationZap.address);
    await nftx.setFeeExclusion(vaultCreationZap.address, true);
  });


  /**
   * Test our vault creation flow
   */

  describe('Create vaults with a variety of configurations', async function () {

    before(async function () {
      // ..
    });

    /**
     * Confirm that a vault can be created when providing all possible options.
     */

    it("1. Should allow 721 vault to be created in a single call", async function () {

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
          mintFee: 10000000,           // 0.10
          randomRedeemFee: 5000000,    // 0.05
          targetRedeemFee: 10000000,   // 0.10
          randomSwapFee: 5000000,      // 0.05
          targetSwapFee: 10000000      // 0.10
        },
    
        // Eligibility storage
        {
          moduleIndex: -1,
          initData: 0
        },

        // Mint and stake
        {
          assetTokenIds: [1, 2, 3, 4],
          assetTokenAmounts: [1, 1, 1, 1],
          minTokenIn: 0,
          minWethIn: 0,
          wethIn: 0
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

      // Confirm our user has the expected balance of inventory staked xToken
      let xToken = await inventoryStaking.vaultXToken(0);
      const xTokenContract = await ethers.getContractAt('XTokenUpgradeable', xToken);
      expect(await xTokenContract.balanceOf(alice.getAddress())).to.equal('4000000000000000000');
    });


    /**
     * Confirm that a vault can be created when providing all possible options.
     */

    it("2. Should allow 1155 vault to be created in a single call", async function () {

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
          moduleIndex: -1,
          initData: 0
        },

        // Mint and stake
        {
          assetTokenIds: [1, 2, 3],
          assetTokenAmounts: [2, 5, 3],
          minTokenIn: 0,
          minWethIn: 0,
          wethIn: 0
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

      // Confirm our user has the expected balance of inventory staked xToken
      let xToken = await inventoryStaking.vaultXToken(1);
      const xTokenContract = await ethers.getContractAt('XTokenUpgradeable', xToken);
      expect(await xTokenContract.balanceOf(alice.getAddress())).to.equal('10000000000000000000');
    });


    /**
     * Confirm that a vault can be created with both inventory and liquidity staking
     * in a single call.
     */

    it("3. Should allow inventory and liquidity staking in a single call", async function () {
        // Mint the vault asset address to Alice (10 tokens)
        for (let i = 11; i < 20; ++i) {
          await erc721.publicMint(alice.address, i);
        }

        // Approve the Vault Creation Zap to use Alice's ERC721s
        await erc721.connect(alice).setApprovalForAll(vaultCreationZap.address, true);

        // Use call static to get the actual return vault from the call. In this case we additionally
        // need to send ETH to the zap in order to fund the liquidity staking. We send 10 ETH but will
        // only need to use 7 ETH of this. For this reason, we need to test that we correctly have 3 ETH
        // returned after the creation.
        const vaultId = await vaultCreationZap.connect(alice).createVault(
          // Vault creation
          {
            name: 'Race Poogers',
            symbol: 'POOGERS',
            assetAddress: erc721.address,
            is1155: false,
            allowAllItems: true
          },

          // Vault features
          32,  // 11111
      
          // Fee assignment
          {
            mintFee: 10000000,           // 0.10
            randomRedeemFee: 5000000,    // 0.05
            targetRedeemFee: 10000000,   // 0.10
            randomSwapFee: 5000000,      // 0.05
            targetSwapFee: 10000000      // 0.10
          },
      
          // Eligibility storage
          {
            moduleIndex: -1,
            initData: 0
          },

          // Mint and stake
          {
            assetTokenIds: [11, 12, 13, 14, 15],
            assetTokenAmounts: [1, 1, 1, 1, 1],
            minTokenIn: '350000000000000000',  // 3.5 tokens
            minWethIn: ethers.utils.parseEther('7'),
            wethIn: ethers.utils.parseEther('7')
          },
          { value: ethers.utils.parseEther('10') }
        );

        // Build our NFTXVaultUpgradeable against the newly created vault
        const newVault = await ethers.getContractAt(
          "NFTXVaultUpgradeable",
          await nftx.vault(2)
        );

        // Confirm our general information
        expect(await newVault.vaultId()).to.equal(2);
        expect(await newVault.name()).to.equal('Race Poogers');
        expect(await newVault.symbol()).to.equal('POOGERS');
        expect(await newVault.assetAddress()).to.equal(erc721.address);

        // Confirm our features
        expect(await newVault.enableMint()).to.equal(true);
        expect(await newVault.enableRandomRedeem()).to.equal(true);
        expect(await newVault.enableTargetRedeem()).to.equal(true);
        expect(await newVault.enableRandomSwap()).to.equal(true);
        expect(await newVault.enableTargetSwap()).to.equal(true);

        // Confirm our fees
        let [mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee] = await newVault.vaultFees();

        expect(mintFee).to.equal("100000000000000000");
        expect(randomRedeemFee).to.equal("50000000000000000");
        expect(targetRedeemFee).to.equal("100000000000000000");
        expect(randomSwapFee).to.equal("50000000000000000");
        expect(targetSwapFee).to.equal("100000000000000000");

        // Confirm our vault's token holdings
        expect(await erc721.balanceOf(newVault.address)).to.equal(5);

        // Confirm our user has the expected balance of inventory staked xToken
        // let xToken = await inventoryStaking.vaultXToken(2);
        // const xTokenContract = await ethers.getContractAt('XTokenUpgradeable', xToken);
        // expect(await xTokenContract.balanceOf(alice.getAddress())).to.equal('1500000000000000000');

        // Confirm our user has the expected balance of liquidity staked xToken
        // dev: We can't actually do this as our liquidity staking is mocked

        // Confirm our remaining ETH was returned. Since we can't account for an exact amount
        // due to gas, we just want to make sure we have more that:
        // 100 (start) - 10 (tx value sent) + 3 (refunded amount) = 93 (with slight gas variance)
        expect(await ethers.provider.getBalance(alice.address)).to.gt(ethers.utils.parseEther('90'));
    });

    /**
     * Confirm that a vault can be created with both inventory and liquidity staking
     * in a single call.
     */

    it("4. Should allow no tokens to be sent when creating", async function () {
        const vaultId = await vaultCreationZap.connect(alice).createVault(
          // Vault creation
          {
            name: "fref",
            symbol: "ferfre",
            assetAddress: "0x3b055557a3d9c638bc32a9cd87dd5f7c740002fa",
            is1155: false,
            allowAllItems: true
          },

          // Vault features
          31,  // 11110
      
          // Fee assignment
          {
            mintFee: 10000000,         // 0.10
            randomRedeemFee: 4000000,  // 0.04
            targetRedeemFee: 6000000,  // 0.10
            randomSwapFee: 4000000,    // 0.04
            targetSwapFee: 10000000    // 0.10
          },
      
          // Eligibility storage
          {
            moduleIndex: -1,
            initData: 0
          },

          // Mint and stake
          {
            assetTokenIds: [],
            assetTokenAmounts: [],
            minTokenIn: 0,
            minWethIn: 0,
            wethIn: 0
          },

          // No msg.value
          {  }
        );

        // Build our NFTXVaultUpgradeable against the newly created vault
        const newVault = await ethers.getContractAt(
          "NFTXVaultUpgradeable",
          await nftx.vault(3)
        );

        // Confirm our general information
        expect(await newVault.vaultId()).to.equal(3);
        expect(await newVault.name()).to.equal('fref');
        expect(await newVault.symbol()).to.equal('ferfre');
        expect(await newVault.assetAddress()).to.equal('0x3b055557A3d9c638bC32A9cd87Dd5F7C740002FA');

        // Confirm our features
        expect(await newVault.enableMint()).to.equal(true);
        expect(await newVault.enableRandomRedeem()).to.equal(true);
        expect(await newVault.enableTargetRedeem()).to.equal(true);
        expect(await newVault.enableRandomSwap()).to.equal(true);
        expect(await newVault.enableTargetSwap()).to.equal(true);

        // Confirm our fees
        let [mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee] = await newVault.vaultFees();

        expect(mintFee).to.equal("100000000000000000");
        expect(randomRedeemFee).to.equal("40000000000000000");
        expect(targetRedeemFee).to.equal("60000000000000000");
        expect(randomSwapFee).to.equal("40000000000000000");
        expect(targetSwapFee).to.equal("100000000000000000");

        // Confirm our vault's token holdings
        expect(await erc721.balanceOf(newVault.address)).to.equal(0);
    });

  });

});


async function _initialise_nftx_contracts() {
  const StakingProvider = await ethers.getContractFactory("MockStakingProvider");
  const provider = await StakingProvider.deploy();
  await provider.deployed();

  // We deploy the liquidity pool staking contract as a mock, as we have a conflict in the
  // test suite in which the staking reward token doesn't match the sushiswap pair, so we
  // never have a sufficient balance to supply. This mock ensures that we just never revert
  // on the call.
  const lpStakingArtifact = await artifacts.readArtifact("NFTXLPStaking");
  lpStaking = await deployMockContract(deployer, lpStakingArtifact.abi);
  await lpStaking.mock.timelockDepositFor.returns();
  await lpStaking.mock.addPoolForVault.returns();

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
    [lpStaking.address, weth.address],
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

  const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
  inventoryStaking = await upgrades.deployProxy(InventoryStaking, [nftx.address], {
    initializer: "__NFTXInventoryStaking_init",
    unsafeAllow: 'delegatecall'
  });
  await inventoryStaking.deployed();

  // Connect our contracts to the NFTX Vault Factory
  await feeDistrib.connect(deployer).setNFTXVaultFactory(nftx.address);
  // await lpStaking.connect(deployer).setNFTXVaultFactory(nftx.address);
}
