const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu, dao, dev;
let factory, proxyController, feeDistributor;
let paycVault, paycNftIds;
let currentFactoryImplAddr, newFactoryImplAddr;
let childImplementation;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 15019580,
          },
        },
      ],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xdea9196dcdd2173d6e369c2acc0facc83fd9346a"],
    });

    zetsu = await ethers.provider.getSigner("0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302");
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2");
    dev = await ethers.provider.getSigner("0xdea9196dcdd2173d6e369c2acc0facc83fd9346a");

    factory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );

    proxyController = await ethers.getContractAt(
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );

    paycVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0xa4009D8Eda6F40f549Dfc10f33F56619b9754C90");
    paycNft = await ethers.getContractAt("IERC721Upgradeable", "0x176e0Fe17314DEf59F0F06e976E1b74203be4a55");

    currentFactoryImplAddr = "0x612447E8d0BDB922059cE048bb5a7CeF9e017812";
  });

  it("Should check factory is working before upgrade", async () => {
    let punkVaultAddr = await factory.vault(0);
    console.log("PUNK address:", punkVaultAddr);

    childImplementation = await factory.childImplementation();
    console.log("childImplementation:", childImplementation);
  });

  it("Should check vault is working before upgrade", async () => {
    let paycNftBalA = await paycNft.balanceOf(zetsu._address);
    await paycVault.connect(zetsu).redeem(1, []);
    let paycNftBalB = await paycNft.balanceOf(zetsu._address);

    expect(paycNftBalB.gt(paycNftBalA)).to.equal(true);
    console.log('PAYC balances:', paycNftBalA.toString(), ':', paycNftBalB.toString());
  });

  it("Should check proxycontroller returns correct implementation before upgrade", async () => {
    let factoryImplAddr = await proxyController.getImpl(0);
    console.log("factory implementation (from proxycontroller):", factoryImplAddr);
    expect(factoryImplAddr).to.equal(currentFactoryImplAddr);
  });

  it("Should upgrade factory", async () => {
    const FactoryImpl = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
    const factoryImpl = await FactoryImpl.deploy();
    await factoryImpl.deployed();
    console.log("factory implementation (new deployment):", factoryImpl.address);

    await proxyController.connect(dao).upgradeProxyTo(0, factoryImpl.address);
    newFactoryImplAddr = factoryImpl.address;
  });

  it("Should check factory is working after upgrade", async () => {
    let punkVaultAddr = await factory.vault(0);
    console.log("PUNK address:", punkVaultAddr);
  });

  it("Should check vault is working after upgrade", async () => {
    let paycNftBalA = await paycNft.balanceOf(zetsu._address);
    await paycVault.connect(zetsu).redeem(1, []);
    let paycNftBalB = await paycNft.balanceOf(zetsu._address);

    expect(paycNftBalB.gt(paycNftBalA)).to.equal(true);
    console.log('PAYC balances:', paycNftBalA.toString(), ':', paycNftBalB.toString());
  });

  it("Should check proxycontroller returns correct implementation after upgrade", async () => {
    let factoryImplAddr = await proxyController.getImpl(0);
    console.log("factory implementation (from proxycontroller):", factoryImplAddr);
    expect(factoryImplAddr).to.equal(newFactoryImplAddr);
  });

  it("Should check new implementation() function works on factory", async () => {
    expect(await factory.childImplementation()).to.equal(childImplementation);
    let implementation = await factory.implementation()
    console.log("implementation (new function):", implementation);
    expect(implementation).to.equal(childImplementation);
  })

});
