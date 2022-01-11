const { expect } = require("chai");
const { expectRevert } = require("../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const addresses = require("../addresses/rinkeby.json");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob;
let nftx;
let staking;
let inventoryStaking;
let erc721;
let feeDistrib;
let provider;
let multiProxyController;

describe("MultiProxyController Cold Test", function () {
  before("Setup", async () => {
    const { chainId } = await ethers.provider.getNetwork()
    console.log(chainId)
    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];

    const StakingProvider = await ethers.getContractFactory(
      "MockStakingProvider"
    );
    provider = await StakingProvider.deploy();
    await provider.deployed();

    const Staking = await ethers.getContractFactory("NFTXLPStaking");
    staking = await upgrades.deployProxy(Staking, [provider.address], {
      initializer: "__NFTXLPStaking__init",
      unsafeAllow: 'delegatecall'
    });
    await staking.deployed();

    const Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    const vault = await Vault.deploy();
    await vault.deployed();

    const FeeDistributor = await ethers.getContractFactory(
      "NFTXSimpleFeeDistributor"
    );
    feeDistrib = await upgrades.deployProxy(
      FeeDistributor,
      [staking.address, notZeroAddr],
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

    const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
    inventoryStaking = await upgrades.deployProxy(
      InventoryStaking,
      [nftx.address],
      {
        initializer: "__NFTXInventoryStaking_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await inventoryStaking.deployed();

    await feeDistrib.connect(primary).setNFTXVaultFactory(nftx.address);
    await feeDistrib.connect(primary).setInventoryStakingAddress(inventoryStaking.address);
    await staking.connect(primary).setNFTXVaultFactory(nftx.address);


    let Zap = await ethers.getContractFactory("NFTXStakingZap");
    zap = await Zap.deploy(
      nftx.address,
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F" /* Sushi Router */
    );
    await zap.deployed();
    await nftx.connect(primary).setFeeExclusion(zap.address, true);

    await feeDistrib.addReceiver(ethers.utils.parseEther("0.8"), inventoryStaking.address, true);

    const Erc721 = await ethers.getContractFactory("ERC721");
    erc721 = await Erc721.deploy(`CryptoPandas`, `CRYPTOPANDAS`);
    await erc721.deployed();

  });

  it("Should deploy multiproxycontroller", async () => {
    const MultiProxyController = await ethers.getContractFactory(
      "MultiProxyController"
    );
    multiProxyController = await MultiProxyController.deploy(
      [
        "Vault Factory",
        "Fee Distributor",
        "LP Staking",
        "Inventory Staking"
      ],
      [
        nftx.address,
        feeDistrib.address,
        staking.address,
        inventoryStaking.address,
      ]
    );
    await multiProxyController.deployed();
  });

  it("Should assign initial proxies properly", async () => {
    let proxiesInfo = await multiProxyController.getAllProxiesInfo();
    let expectedInfo = [
      "0: Vault Factory",
      "1: Fee Distributor",
      "2: LP Staking",
      "3: Inventory Staking"
    ]
    for (let i = 0; i < proxiesInfo.length; i++) {
      expect(proxiesInfo[i]).to.be.equal(expectedInfo[i]);
    }
  }) 

  it("Should get all proxy addresses", async () => {
    let proxies = await multiProxyController.getAllProxies();
    let expectedInfo = [
      `${nftx.address}`,
      `${feeDistrib.address}`,
      `${staking.address}`,
      `${inventoryStaking.address}`
    ]
    for (let i = 0; i < proxies.length; i++) {
      expect(proxies[i]).to.be.equal(expectedInfo[i]);
    }
  })

  it("Assign all to multiproxycontroller", async () => {
    await upgrades.admin.changeProxyAdmin(nftx.address, multiProxyController.address);
    await upgrades.admin.changeProxyAdmin(feeDistrib.address, multiProxyController.address);
    await upgrades.admin.changeProxyAdmin(staking.address, multiProxyController.address);
    await upgrades.admin.changeProxyAdmin(inventoryStaking.address, multiProxyController.address);
  });
  
  it("Starts all impl addresses at 0", async () => {
    let impls = await multiProxyController.getAllImpls();
    for (let i = 0; i < impls.length; i++) {
      expect(impls[i]).to.equal(zeroAddr);
    }
  })

  it("Can assign all impls", async () => {
    await multiProxyController.assignAllImpls();
    let impls = await multiProxyController.getAllImpls();
    for (let i = 0; i < impls.length; i++) {
      expect(impls[i]).to.not.equal(zeroAddr);
    }
  })
});
