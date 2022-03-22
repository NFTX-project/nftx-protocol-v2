const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let primary, alice, bob, zetsu, gaus;
let dao;
let factory, invStaking, sushiRouter, unstakingZap, lpStaking, proxyController, zapRegistry;

const faceVaultId = 43;

let xFaceWeth, faceWeth, face, weth, xFace, chainFacesNft, faceWethPair;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
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

    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xf3CAD40f7f7b43ae2A4226A8c53420569458710C"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });

    zetsu = await ethers.provider.getSigner("0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302");
    gaus = await ethers.provider.getSigner("0xf3CAD40f7f7b43ae2A4226A8c53420569458710C");
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2");

    factory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );

    invStaking = await ethers.getContractAt("NFTXInventoryStaking", "0x3E135c3E981fAe3383A5aE0d323860a34CfAB893");
    proxyController = await ethers.getContractAt(
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );

    lpStaking = await ethers.getContractAt("NFTXLPStaking", "0x688c3E4658B5367da06fd629E41879beaB538E37");
    sushiRouter = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    faceWethPair = await ethers.getContractAt("IUniswapV2Pair", "0x98a2836Cef3f9e4325Ba1f049Ba24c7184e6D60e");

    xFaceWeth = await ethers.getContractAt(
      "RewardDistributionTokenUpgradeable",
      "0xAC1277d0eC5E501F7958A756DD26a55E33d77D8D"
    );
    faceWeth = await ethers.getContractAt("ERC20Upgradeable", "0x98a2836Cef3f9e4325Ba1f049Ba24c7184e6D60e");
    weth = await ethers.getContractAt("ERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    xFace = await ethers.getContractAt("ERC20Upgradeable", "0x592E3BbeAC2A54C2b568A6db5CBF1455b2682a7c");
    face = await ethers.getContractAt("ERC20Upgradeable", "0xcd46d92C46be1DbbD5CcC497e95611ABE9D507Bc");
    chainFacesNft = await ethers.getContractAt("ERC721", "0x91047Abf3cAb8da5A9515c8750Ab33B4f1560a7A");
  });

  it("Should deploy unstakingzap", async () => {
    const UnstakingZap = await ethers.getContractFactory("NFTXUnstakingZap");
    unstakingZap = await UnstakingZap.deploy();
    await unstakingZap.deployed();

    await unstakingZap.setVaultFactory("0xBE86f647b167567525cCAAfcd6f881F1Ee558216");
    await unstakingZap.setInventoryStaking("0x3E135c3E981fAe3383A5aE0d323860a34CfAB893");
    await unstakingZap.setLpStaking("0x688c3E4658B5367da06fd629E41879beaB538E37");
    await unstakingZap.setSushiRouterAndWeth("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
  });

  it("Should exclude unstakingzap from fees", async () => {
    await factory.connect(dao).setFeeExclusion(unstakingZap.address, "true");
  });

  it("Should deploy and setup ZapRegistry", async () => {
    let ZapRegistry = await ethers.getContractFactory("ZapRegistry");
    zapRegistry = await ZapRegistry.deploy();
    await zapRegistry.deployed();
    await zapRegistry.addZap(unstakingZap.address, "UnstakingZap");
  });

  it("Should upgrade lpStaking and set zapregistry", async () => {
    const LpStaking = await ethers.getContractFactory("NFTXLPStaking");
    const lpStakingImpl = await LpStaking.deploy();
    await lpStakingImpl.deployed();
    await proxyController.connect(dao).upgradeProxyTo(2, lpStakingImpl.address);
    await lpStaking.connect(dao).setZapRegistry(zapRegistry.address);
  });

  it("Should upgrade TimelockRewardDistributionTokenImpl and set on lpStaking", async () => {
    const Trdti = await ethers.getContractFactory("TimelockRewardDistributionTokenImpl");
    const trdti = await Trdti.deploy();
    await trdti.deployed();

    await lpStaking.connect(dao).setNewTimelockRewardDistTokenImpl(trdti.address);
  });

  it("Should unstake FACEWETH liquidity", async () => {
    xFaceWeth.connect(zetsu).approve(unstakingZap.address, BASE.mul(1000));

    const runUnstakeLiquidityTest = async (
      xFaceWethAmount, // bigNum
      numNfts, // number
      minNumNfts, // number
      vTokenPortionToSell, // bigNum
      vTokenPortionToStake // bigNum
    ) => {
      let xFaceWethBalInitial = await xFaceWeth.balanceOf(zetsu._address);
      console.log("xFACEWETH balance (initial):", formatEther(xFaceWethBalInitial));
      let faceWethBalInitial = await faceWeth.balanceOf(zetsu._address);
      console.log("FACEWETH balance (initial):", formatEther(faceWethBalInitial));
      let faceBalInitial = await face.balanceOf(zetsu._address);
      console.log("FACE balance (initial):", formatEther(faceBalInitial));
      let wethBalInitial = await weth.balanceOf(zetsu._address);
      console.log("WETH balance (initial):", formatEther(wethBalInitial));
      let chainFacesNftBalInitial = await chainFacesNft.balanceOf(zetsu._address);
      console.log("Chainfaces NFT balance (initial):", chainFacesNftBalInitial.toString());

      let unclaimedFaceRewards = (await xFaceWeth.accumulativeRewardOf(zetsu._address)).sub(
        await xFaceWeth.withdrawnRewardOf(zetsu._address)
      );
      console.log("Unclaimed FACE rewards:", formatEther(unclaimedFaceRewards));

      let faceWethSupply = BigNumber.from(await faceWeth.totalSupply());
      let expectedFaceWethReceived = xFaceWethAmount;
      let faceWethPortion = expectedFaceWethReceived.mul(BASE).div(faceWethSupply);
      console.log("faceWethSupply:", formatEther(faceWethSupply));
      console.log("expectedFaceWethReceived:", formatEther(expectedFaceWethReceived));
      console.log("faceWethPortion:", formatEther(faceWethPortion));

      let [wethReserves, faceReserves] = await faceWethPair.getReserves();
      console.log("faceReserves:", formatEther(faceReserves));
      console.log("wethReserves:", formatEther(wethReserves));

      let expectedFaceFromSlp = faceReserves.mul(faceWethPortion).div(BASE);
      console.log("expectedFaceReceived:", formatEther(expectedFaceFromSlp));
      let expectedWethFromSlp = wethReserves.mul(faceWethPortion).div(BASE);
      console.log("expectedWethReceived:", formatEther(expectedWethFromSlp));

      let min = (bigNumA, bigNumB) => {
        return bigNumA.lt(bigNumB) ? bigNumA : bigNumB;
      };

      let expectedNftsRedeemed = min(expectedFaceFromSlp.div(BASE), BigNumber.from(numNfts));
      let expectedFaceAfterRedeeming = expectedFaceFromSlp
        .add(unclaimedFaceRewards)
        .sub(expectedNftsRedeemed.mul(BASE));

      let remainingFaceReserves = faceReserves.sub(expectedFaceFromSlp);
      let remainingWethReserves = wethReserves.sub(expectedWethFromSlp);

      let expectedFaceSold = expectedFaceAfterRedeeming.mul(vTokenPortionToSell).div(BASE);

      let expectedWethFromFaceSale = BigNumber.from(0);
      if (vTokenPortionToSell.gt(0)) {
        expectedWethFromFaceSale = BigNumber.from(
          await sushiRouter.quote(faceToSell, remainingFaceReserves, remainingWethReserves)
        );
      }

      let expectedFaceStaked = expectedFaceAfterRedeeming.mul(vTokenPortionToStake).div(BASE);

      let expectedFaceFinal = expectedFaceAfterRedeeming.sub(expectedFaceSold).sub(expectedFaceStaked);

      await unstakingZap
        .connect(zetsu)
        .unstakeLiquidity(
          face.address,
          xFaceWethAmount,
          expectedFaceFromSlp.mul(999).div(1000),
          expectedWethFromSlp.mul(999).div(1000),
          numNfts,
          minNumNfts,
          vTokenPortionToSell,
          expectedWethFromFaceSale.mul(9).div(10),
          vTokenPortionToStake
        );
      console.log("");

      let faceBal = await face.balanceOf(zetsu._address);
      let faceReceived = faceBal.sub(faceBalInitial);
      console.log("faceReceived:", formatEther(faceReceived));
      console.log("expectedFaceFinal:", formatEther(expectedFaceFinal));

      // let wethBal = await weth.balanceOf();
    };

    let xFaceWethBal = await xFaceWeth.balanceOf(zetsu._address);
    await runUnstakeLiquidityTest(xFaceWethBal, 0, 0, BigNumber.from(0), BigNumber.from(0));
  });
});
