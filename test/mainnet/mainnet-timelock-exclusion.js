const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let invStaking, controller;

const coolVaultId = 31;

let xCool, coolToken;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet timelock exclusion tests", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14535425,
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

    invStaking = await ethers.getContractAt("NFTXInventoryStaking", "0x3E135c3E981fAe3383A5aE0d323860a34CfAB893");

    controller = await ethers.getContractAt("ProxyController", "0x4333d66Ec59762D1626Ec102d7700E64610437Df");

    xCool = await ethers.getContractAt("ERC20Upgradeable", "0xb31858B8a49DD6099869B034DA14a7a9CAd1382b");
    coolToken = await ethers.getContractAt("ERC20Upgradeable", "0x114f1388fAB456c4bA31B1850b244Eedcd024136");

    await dao.sendTransaction({
      to: zetsu._address,
      value: ethers.utils.parseEther("10.0"),
    });
  });

  it("Should upgrade inventorystaking", async () => {
    const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
    let inventoryStaking = await InventoryStaking.deploy();
    await inventoryStaking.deployed();

    await controller.connect(dao).upgradeProxyTo(5, inventoryStaking.address);
  });

  it("Should set inventoryLockTimeErc20", async () => {
    await expectRevert(invStaking.connect(zetsu).setInventoryLockTimeErc20("2"));
    await invStaking.connect(dao).setInventoryLockTimeErc20(2);
  });

  /* it("Should stake coolToken with timelock", async () => {
    await coolToken.connect(zetsu).approve(invStaking.address, BASE.mul(1000));

    let coolTokenBal = await coolToken.balanceOf(zetsu._address);
    console.log("COOL balance (initial):", formatEther(coolTokenBal));

    let xCoolBal = await xCool.balanceOf(zetsu._address);
    console.log("xCOOL balance (initial):", formatEther(xCoolBal));

    let timelockedUntil = await invStaking.timelockUntil(coolVaultId, zetsu._address);
    console.log("timelockedUntil (initial):", timelockedUntil);

    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    timelockedUntil = await invStaking.timelockUntil(coolVaultId, zetsu._address);
    console.log("timelockedUntil (initial):", timelockedUntil);
  });

  it("Should deploy timelockexcludelist", async () => {
    const TimelockExcludeList = await ethers.getContractFactory("TimelockExcludeList");
    timelockExcludeList = await TimelockExcludeList.deploy();
    await timelockExcludeList.deployed();

    // TODO
  }); */
});
