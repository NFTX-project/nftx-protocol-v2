const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network, waffle } = require("hardhat");
const { provider } = waffle;
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let vaultFactory, hdpunkVaultOld, hdpunkVaultNew, hdpunkToken, sushiRouter;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet surge fees", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14370769,
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

    await dao.sendTransaction({
      to: zetsu._address,
      value: parseEther("20"),
    });

    vaultFactory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    hdpunkToken = await ethers.getContractAt("ERC20Upgradeable", "0x42B4dF7e402A71EAE743c6C5410CE3BBb63aEf22");
    hdpunkVaultOld = await ethers.getContractAt(
      "NFTXVaultUpgradeableOld",
      "0x42B4dF7e402A71EAE743c6C5410CE3BBb63aEf22"
    );
    sushiRouter = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
  });

  it("Should buy HDPUNK from sushi", async () => {
    await sushiRouter
      .connect(zetsu)
      .swapExactETHForTokens(
        100,
        ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0x42B4dF7e402A71EAE743c6C5410CE3BBb63aEf22"],
        zetsu._address,
        1749541549,
        { value: parseEther("2") }
      );
  });

  it("Should redeem using old vault implementation", async () => {
    for (let i = 0; i < 5; i++) {
      let tx = await hdpunkVaultOld.connect(zetsu).redeem(1, []);
      let receipt = await tx.wait();
      console.log("gas used (old):", receipt.cumulativeGasUsed.toNumber());
    }
  });

  it("Should deploy and upgrade vault implementation", async () => {
    let Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    let vaultImpl = await Vault.deploy();
    await vaultImpl.deployed();

    await vaultFactory.connect(dao).upgradeChildTo(vaultImpl.address);

    hdpunkVaultNew = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x42B4dF7e402A71EAE743c6C5410CE3BBb63aEf22"
    );
  });

  it("Should redeem using new vault implementation", async () => {
    for (let i = 0; i < 5; i++) {
      let tx = await hdpunkVaultNew.connect(zetsu).redeem(1, []);
      let receipt = await tx.wait();
      console.log("gas used (new):", receipt.cumulativeGasUsed.toNumber());
    }
  });
});
