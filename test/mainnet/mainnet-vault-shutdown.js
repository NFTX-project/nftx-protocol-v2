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
            blockNumber: 14714200,
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

  it("Should test shutdown", async () => {
    let nounVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x270B157A6bb0290484866383E14c1ef9375C6Fe8");  // holdings = 1, 721
    let nounNft = await ethers.getContractAt("ERC721", "0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03");

    await expectRevert(nounVault.connect(zetsu).shutdown(zetsu._address));

    console.log("nounNFT balance (start):", (await nounNft.balanceOf(zetsu._address)).toString());
    await nounVault.connect(dao).shutdown(zetsu._address);
    console.log("nounNFT balance (end):", (await nounNft.balanceOf(zetsu._address)).toString(), '\n');

    let mekaVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x0a776842783488E2b4E1277e98C05923874bfA7d");  // holdings = 3, 721
    let mekaNft = await ethers.getContractAt("ERC721", "0x9A534628B4062E123cE7Ee2222ec20B86e16Ca8F");

    console.log("mekaNft balance (start):", (await mekaNft.balanceOf(zetsu._address)).toString());
    await mekaVault.connect(dao).shutdown(zetsu._address);
    console.log("mekaNft balance (end):", (await mekaNft.balanceOf(zetsu._address)).toString(), '\n');

    let miniVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x167C0A0B9AEB4febe50E965db6293bD886C91322");  // holdings = 4, 721

    await expectRevert(miniVault.connect(dao).shutdown(zetsu._address));

    await mekaNft.connect(zetsu).approve(mekaVault.address, 1974);
    await expectRevert(mekaVault.connect(zetsu).mint([1974], [1]));


  });

});
