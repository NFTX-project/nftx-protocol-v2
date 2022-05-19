const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let flashBorrower;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14807601,
          },
        },
      ],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302"],
    });

    zetsu = await ethers.provider.getSigner("0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302");
  });

  it("Should deploy FlashBorrower vault contract", async () => {
    const FlashBorrower = await ethers.getContractFactory("FlashBorrower");
    flashBorrower = await FlashBorrower.deploy();
    await flashBorrower.deployed();
  });

  it("Should run FlashBorrower COOL", async () => {
    const coolAddr = "0x114f1388fab456c4ba31b1850b244eedcd024136";
    const coolToken = await ethers.getContractAt("IERC20Upgradeable", coolAddr);
    await coolToken.connect(zetsu).transfer(flashBorrower.address, BASE.div(10).mul(2));
    await flashBorrower.flashBorrow(coolAddr, coolAddr, BASE);
  });
});
