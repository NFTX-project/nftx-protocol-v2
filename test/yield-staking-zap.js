const { expect } = require("chai");
const { ethers } = require("hardhat");

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE = 1e18;
const TOKENS_IN_0X = 500;


// Store our internal contract references
let weth, erc721;
let nftx, vault;
let inventoryStaking, lpStaking;
let zap;

// Store any user addresses we want to interact with
let deployer, alice, bob, users;

// Set some 0x variables
let swapTarget, swapCallData;


/**
 * Validates our expected NFTX allocator logic.
 */

describe('Yield Staking Zap', function () {

  /**
   * Confirm that tokens cannot be sent to invalid recipient.
   */

  before(async function () {
    // Set up our deployer / owner address
    [deployer, alice, bob, carol, ...users] = await ethers.getSigners()

    // Set up a test ERC20 token to simulate WETH
    const WETH = await ethers.getContractFactory("WETH");
    weth = await WETH.deploy();
    await weth.deployed();

    // Fill our WETH contract with Carol's juicy ETH
    await carol.sendTransaction({
      to: weth.address,
      value: ethers.utils.parseEther("50")
    })

    // Set up a test ERC721 token
    const Erc721 = await ethers.getContractFactory("ERC721");
    erc721 = await Erc721.deploy('SpacePoggers', 'POGGERS');
    await erc721.deployed();

    // Set up our NFTX contracts
    await _initialise_nftx_contracts()

    // Deploy our vault's xtoken
    await inventoryStaking.deployXTokenForVault(await vault.vaultId());

    // Set up our 0x mock. Our mock gives us the ability to set a range of parameters
    // against the contract that would normally be out of our control. This allows us
    // to control expected, external proceedures.
    const Mock0xProvider = await ethers.getContractFactory("Mock0xProvider")
    mock0xProvider = await Mock0xProvider.deploy()
    await mock0xProvider.deployed()

    // Set up our NFTX Marketplace 0x Zap
    const YieldStakingZap = await ethers.getContractFactory('NFTXYieldStakingZap')
    yieldStakingZap = await YieldStakingZap.deploy(nftx.address, inventoryStaking.address, lpStaking.address, weth.address);
    await yieldStakingZap.deployed()

    // Allow our yield staking zap to exclude fees
    await nftx.setZapContract(yieldStakingZap.address);
    await nftx.setFeeExclusion(yieldStakingZap.address, true);

    // Add WETH to the 0x pool
    await weth.mint(mock0xProvider.address, String(BASE * TOKENS_IN_0X))
    expect(await weth.balanceOf(mock0xProvider.address)).to.equal(String(BASE * TOKENS_IN_0X))

    // Give Alice a bunch of tokens to throw into the vault (20 tokens)
    for (let i = 0; i < 20; ++i) {
      await erc721.publicMint(alice.address, i);
      await erc721.connect(alice).approve(vault.address, i);
    }

    // Add vault token to our 0x mock
    // Send the tokens to our 0x contract from Alice
    await vault.connect(alice).mintTo(
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      mock0xProvider.address
    );

    // Set our 0x data
    swapTarget = mock0xProvider.address;
    swapCallData = _create_call_data(weth.address, vault.address);
  });


  describe('buyAndStakeInventory', async function () {

    before(async function () {
      // Set the 0x payout token and amount
      await mock0xProvider.setPayInAmount(String(BASE));   // 1
      await mock0xProvider.setPayOutAmount(String(BASE * 2));  // 2
    });

    it("Should ensure a tx value is sent", async function () {
      await expect(
        yieldStakingZap.connect(alice).buyAndStakeInventory(await vault.vaultId(), swapTarget, swapCallData)
      ).to.be.revertedWith('Invalid value provided');
    });

    it("Should require a valid vault ID", async function () {
      // This will be reverted with a panic code, as the internal NFTX vault mapping does
      // not check that the ID exists before referencing it.
      await expect(
        yieldStakingZap.connect(alice).buyAndStakeInventory(
          420,
          swapTarget,
          swapCallData,
          {value: ethers.utils.parseEther("1")}
        )
      ).to.be.reverted;
    });

    it("Should allow for ETH to be staked into xToken", async function () {
      await yieldStakingZap.connect(alice).buyAndStakeInventory(
        await vault.vaultId(),
        swapTarget,
        swapCallData,
        {value: ethers.utils.parseEther("1")}
      );

      // Our sender should now have 2 xToken
      let vaultXTokenAddress = await inventoryStaking.vaultXToken(await vault.vaultId());
      const xToken = await ethers.getContractAt("XTokenUpgradeable", vaultXTokenAddress);
      expect(await xToken.balanceOf(alice.address)).to.equal('2000000000000000000');
    });

    it("Should refund any ETH that remains after transaction", async function () {
      let startBalance = await ethers.provider.getBalance(bob.address);

      await yieldStakingZap.connect(bob).buyAndStakeInventory(
        await vault.vaultId(),
        swapTarget,
        swapCallData,
        {value: ethers.utils.parseEther("2")}
      );

      // User should have had 1 ETH refunded (we use not equal to allow for dust loss)
      expect(await ethers.provider.getBalance(bob.address)).to.not.equal(0);
    });

  });


  describe('buyAndStakeLiquidity', async function () {

    before(async function () {
      // Set the 0x payout token and amount
      await mock0xProvider.setPayInAmount(String(BASE));   // 1
      await mock0xProvider.setPayOutAmount(String(BASE * 2));  // 2
    });

    it("Should ensure a tx value is sent", async function () {
      await expect(
        yieldStakingZap.connect(alice).buyAndStakeLiquidity(await vault.vaultId(), swapTarget, swapCallData)
      ).to.be.revertedWith('Invalid value provided');
    });

    it("Should require a valid vault ID", async function () {
      // This will be reverted with a panic code, as the internal NFTX vault mapping does
      // not check that the ID exists before referencing it.
      await expect(
        yieldStakingZap.connect(alice).buyAndStakeLiquidity(
          420,
          swapTarget,
          swapCallData,
          {value: ethers.utils.parseEther("1")}
        )
      ).to.be.reverted;
    });

    it("Should allow for ETH to be staked into xToken", async function () {
      await yieldStakingZap.connect(alice).buyAndStakeLiquidity(
        await vault.vaultId(),
        swapTarget,
        swapCallData,
        {value: ethers.utils.parseEther("1")}
      );

      // Our sender should now have 2 xToken
      let vaultXTokenAddress = await lpStaking.newRewardDistributionToken(await vault.vaultId());
      console.log(vaultXTokenAddress);

      const xToken = await ethers.getContractAt("IERC20Upgradeable", vaultXTokenAddress);
      console.log(xToken);

      expect(await xToken.balanceOf(alice.address)).to.equal('2000000000000000000');
    });

    it("Should refund any ETH that remains after transaction", async function () {
      let startBalance = await ethers.provider.getBalance(bob.address);

      await yieldStakingZap.connect(alice).buyAndStakeLiquidity(
        await vault.vaultId(),
        swapTarget,
        swapCallData,
        {value: ethers.utils.parseEther("2")}
      );

      // User should have had 1 ETH refunded (we use not equal to allow for dust loss)
      expect(await ethers.provider.getBalance(bob.address)).to.not.equal(0);
    });

  });

});


async function _initialise_nftx_contracts() {
  const StakingProvider = await ethers.getContractFactory("MockStakingProvider");
  const provider = await StakingProvider.deploy();
  await provider.deployed();

  const LPStaking = await ethers.getContractFactory("NFTXLPStaking");
  lpStaking = await upgrades.deployProxy(LPStaking, [provider.address], {
    initializer: "__NFTXLPStaking__init",
    unsafeAllow: 'delegatecall'
  });
  await lpStaking.deployed();

  const NFTXVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const nftxVault = await NFTXVault.deploy();
  await nftxVault.deployed();

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
  await lpStaking.connect(deployer).setNFTXVaultFactory(nftx.address);

  // Register our 721 NFTX vault that we will use for testing
  let response = await nftx.createVault(
    'Space Poggers',  // name
    'POGGERS',        // symbol
    erc721.address,   // _assetAddress
    false,            // is1155
    true              // allowAllItems
  );

  let receipt = await response.wait(0);
  let vaultId = receipt.events.find((elem) => elem.event === "NewVault").args[0].toString();
  let vaultAddr = await nftx.vault(vaultId)
  let vaultArtifact = await artifacts.readArtifact("NFTXVaultUpgradeable");

  vault = new ethers.Contract(vaultAddr, vaultArtifact. abi,ethers.provider);
}

function _create_call_data(tokenIn, tokenOut) {
  let parsedABI = new ethers.utils.Interface(["function transfer(address spender, address tokenIn, address tokenOut) payable"]);
  return parsedABI.encodeFunctionData('transfer', [yieldStakingZap.address, tokenIn, tokenOut])
}
