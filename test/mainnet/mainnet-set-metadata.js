const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let factory;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14928953,
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

    zetsu = await ethers.provider.getSigner("0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302");
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2");

    factory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
  });

  it("Should upgrade vault contract", async () => {
    const VaultImpl = await ethers.getContractFactory("NFTXVaultUpgradeable");
    const vaultImpl = await VaultImpl.deploy();
    await vaultImpl.deployed();

    await factory.connect(dao).upgradeChildTo(vaultImpl.address);
  });

  it("Should update PUNK vault metadata", async () => {
    let punkVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x269616D549D7e8Eaa82DFb17028d0B212D11232A");

    console.log("original name", await punkVault.name());
    console.log("original symbol", await punkVault.symbol());

    await punkVault.connect(dao).setVaultMetadata("new", "NEW");

    console.log("new name", await punkVault.name());
    console.log("new symbol", await punkVault.symbol());
  });

  
});
