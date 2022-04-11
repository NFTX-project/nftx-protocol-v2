const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network, waffle } = require("hardhat");
const { provider } = waffle;
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

const surgeFeeStep = 3;

let zetsu;
let dao;
let vaultFactory, punkVault, punkToken, sushiRouter;

let holdings, randomRedeemFee;
let numRedeemsA, numRedeemsB, numRedeemsC;
let blockNumA, blockNumB, blockNumC;

// const hdpunkVaultId = 26;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet surge fees", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14370770,
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

    punkToken = await ethers.getContractAt("ERC20Upgradeable", "0x269616D549D7e8Eaa82DFb17028d0B212D11232A");

    sushiRouter = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
  });

  it("Should sell NFTX and buy PUNK", async () => {
    let nftxToken = await ethers.getContractAt("ERC20Upgradeable", "0x87d73e916d7057945c9bcd8cdd94e42a6f47f776");

    await nftxToken.connect(dao).approve(sushiRouter.address, parseEther("200000"));

    await sushiRouter
      .connect(dao)
      .swapExactTokensForETH(
        parseEther("200000"),
        10,
        ["0x87d73e916d7057945c9bcd8cdd94e42a6f47f776", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"],
        dao._address,
        1749541549
      );

    await sushiRouter
      .connect(dao)
      .swapExactETHForTokens(
        10,
        ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "0x269616D549D7e8Eaa82DFb17028d0B212D11232A"],
        zetsu._address,
        1749541549,
        { value: parseEther("1100") }
      );

    const daoEthBal = await provider.getBalance(dao._address);

    console.log("daoEthBal", formatEther(daoEthBal));
  });

  it("Should send PUNK to zetsu", async () => {
    let punkBal = await punkToken.balanceOf(dao._address);
    await punkToken.connect(dao).transfer(zetsu._address, punkBal);

    console.log("PUNK bal:", formatEther(await punkToken.balanceOf(zetsu._address)));
  });

  it("Should deploy and upgrade vault implementation", async () => {
    let Vault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    let vaultImpl = await Vault.deploy();
    await vaultImpl.deployed();

    await vaultFactory.connect(dao).upgradeChildTo(vaultImpl.address);

    punkVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x269616D549D7e8Eaa82DFb17028d0B212D11232A");
  });

  it("Should charge surge fee for new activity", async () => {
    holdings = (await punkVault.totalHoldings()).toNumber();
    console.log("holdings:", holdings, "\n");
    numRedeemsA = 25;

    let expectedNewFeeRate = ((numRedeemsA - 1) / holdings - 0.15) * surgeFeeStep;
    expectedNewFeeRate = Math.max(expectedNewFeeRate, 0);
    let expectedNewFee = expectedNewFeeRate * numRedeemsA;

    randomRedeemFee = await punkVault.randomRedeemFee();

    let initialPunkBal = await punkToken.balanceOf(zetsu._address);

    let tx = await punkVault.connect(zetsu).redeem(numRedeemsA, []);
    let receipt = await tx.wait();
    blockNumA = receipt.blockNumber;

    let newPunkBal = await punkToken.balanceOf(zetsu._address);

    let punkSpent = initialPunkBal.sub(newPunkBal);
    let surgeFeeSpent = punkSpent.sub(BASE.add(randomRedeemFee).mul(numRedeemsA));

    console.log("num redeems:", numRedeemsA);
    console.log("expected surge fee:", expectedNewFee.toString());
    console.log("surge fee spent:", formatEther(surgeFeeSpent));

    console.log("--- total turnover:", numRedeemsA / holdings);
    console.log("--- surge fee rate:", expectedNewFeeRate);
  });

  it("Should charge surge fee for recent activity", async () => {
    console.log("");
    numRedeemsB = 1;

    let initialPunkBal = await punkToken.balanceOf(zetsu._address);

    let tx = await punkVault.connect(zetsu).redeem(numRedeemsB, []);
    let receipt = await tx.wait();
    blockNumB = receipt.blockNumber;

    // retroactively figure out expected fee using blocknumber...

    let blocksPassed = blockNumB - blockNumA;
    let recentRelativeTurnover = numRedeemsA / holdings;
    let timeCoefficient = (25 - blocksPassed) / 25;
    let expectedRecentFeeRate = (recentRelativeTurnover - 0.15) * timeCoefficient * surgeFeeStep;
    expectedRecentFeeRate = Math.max(expectedRecentFeeRate, 0);
    let expectedRecentFee = expectedRecentFeeRate * numRedeemsB;

    let newPunkBal = await punkToken.balanceOf(zetsu._address);

    let punkSpent = initialPunkBal.sub(newPunkBal);
    let surgeFeeSpent = punkSpent.sub(BASE.add(randomRedeemFee).mul(numRedeemsB));

    console.log("num redeems:", numRedeemsB);
    console.log("expected surge fee:", expectedRecentFee.toString());
    console.log("surge fee spent:", formatEther(surgeFeeSpent));
    console.log("--- total turnover:", (numRedeemsA + numRedeemsB) / holdings);
    console.log("--- surge fee rate:", expectedRecentFeeRate);
  });

  it("Should charge surge fee for recent activity and new activity", async () => {
    console.log("");
    numRedeemsC = 10;

    let initialPunkBal = await punkToken.balanceOf(zetsu._address);

    let tx = await punkVault.connect(zetsu).redeem(numRedeemsC, []);
    let receipt = await tx.wait();
    blockNumC = receipt.blockNumber;

    // retroactively figure out expected fee using blocknumber...

    let blocksPassed = blockNumC - blockNumB;
    let recentRelativeTurnover = (numRedeemsA + numRedeemsB) / holdings;
    let timeCoefficient = (25 - blocksPassed) / 25;
    let expectedRecentFeeRate = (recentRelativeTurnover - 0.15) * timeCoefficient * surgeFeeStep;
    expectedRecentFeeRate = Math.max(expectedRecentFeeRate, 0);
    let expectedRecentFee = expectedRecentFeeRate * numRedeemsC;

    let newTurnover = (numRedeemsC - 1) / holdings;
    let combinedTurnover = newTurnover + recentRelativeTurnover;
    let newCoefficient = newTurnover / combinedTurnover;
    let expectedNewFeeRate = (combinedTurnover - 0.15) * newCoefficient * surgeFeeStep;
    expectedNewFeeRate = Math.max(expectedNewFeeRate, 0);
    let expectedNewFee = expectedNewFeeRate * numRedeemsC;

    let newPunkBal = await punkToken.balanceOf(zetsu._address);

    let punkSpent = initialPunkBal.sub(newPunkBal);
    let surgeFeeSpent = punkSpent.sub(BASE.add(randomRedeemFee).mul(numRedeemsC));

    console.log("num redeems:", numRedeemsC);
    console.log("expected surge fee:", (expectedRecentFee + expectedNewFee).toString());
    console.log("surge fee spent:", formatEther(surgeFeeSpent));
    console.log("--- total turnover:", (numRedeemsA + numRedeemsB + numRedeemsC) / holdings);
    console.log("--- surge fee rate:", expectedNewFeeRate + expectedRecentFeeRate);
  });

  /* it("Should see surge fee decrease over time", async () => {
    console.log("");
    for (let i = 0; i < 20; i++) {
      let blockNum = await provider.getBlockNumber();
      console.log("index", i, "block:", blockNum);
      await network.provider.send("evm_mine");

      let surgeFee = await punkVault.calcSurgeFee(1, 0);
      console.log("surge fee (A):", formatEther(surgeFee));
      let surgeFeeNext = await punkVault.calcSurgeFee(1, 1);
      console.log("surge fee (B):", formatEther(surgeFeeNext));
      let surgeFeeFuture = await punkVault.calcSurgeFee(1, 10);
      console.log("surge fee (C):", formatEther(surgeFeeFuture));
    }
  }); */
});
