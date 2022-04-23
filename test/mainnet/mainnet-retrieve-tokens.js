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
            blockNumber: 14592914,
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

  it("Should retrieve BAYC", async () => {
    let baycToken = await ethers.getContractAt("ERC20Upgradeable", "0xEA47B64e1BFCCb773A0420247C0aa0a3C1D2E5C5");
    let baycVault = await ethers.getContractAt("NFTXVaultUpgradeable", baycToken.address);

    let amount = parseEther("0.685681182190338799");
    let from = "0x2a811da74f22b3222f67cf034467536b97494f9c";
    let to = "0x701f373df763308d96d8537822e8f9b2bae4e847";

    let fromBalInitial = await baycToken.balanceOf(from);
    let toBalInitial = await baycToken.balanceOf(to);

    console.log("fromBalInitial", formatEther(fromBalInitial));
    console.log("toBalInitial", formatEther(toBalInitial));

    await baycVault.connect(dao).retrieveTokens(amount, from, to);

    let fromBal = await baycToken.balanceOf(from);
    let toBal = await baycToken.balanceOf(to);

    console.log("fromBal", formatEther(fromBal));
    console.log("toBal", formatEther(toBal));
  });

  it("Should upgrade lp-staking contract", async () => {
    const LPStaking = await ethers.getContractFactory("NFTXLPStaking");
    const lpStaking = await LPStaking.deploy();
    await lpStaking.deployed();

    const multiProxyContr = await ethers.getContractAt(
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );
    await multiProxyContr.connect(dao).upgradeProxyTo(2, lpStaking.address);
  });

  it("Should retrieve xMOONCATWETH", async () => {
    const mooncatVaultId = 25;
    let xMooncatWeth = await ethers.getContractAt(
      "IERC20Upgradeable",
      "0x2a811dA74F22B3222F67cF034467536b97494f9c"
    );

    let amount = parseEther("14.001428498549710478");
    let from = "0x2a811da74f22b3222f67cf034467536b97494f9c";
    let to = "0x701f373df763308d96d8537822e8f9b2bae4e847";

    let fromBalInitial = await xMooncatWeth.balanceOf(from);
    let toBalInitial = await xMooncatWeth.balanceOf(to);

    console.log("fromBalInitial", formatEther(fromBalInitial));
    console.log("toBalInitial", formatEther(toBalInitial));

    let lpStaking = await ethers.getContractAt("NFTXLPStaking", "0x688c3E4658B5367da06fd629E41879beaB538E37");
    await lpStaking.connect(dao).retrieveTokens(mooncatVaultId, amount, from, to);

    let fromBal = await xMooncatWeth.balanceOf(from);
    let toBal = await xMooncatWeth.balanceOf(to);

    console.log("fromBal", formatEther(fromBal));
    console.log("toBal", formatEther(toBal));
  });
});
