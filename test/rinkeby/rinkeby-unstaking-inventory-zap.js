const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let devA, devB;
let factory, invStaking, unstakingZap;

const klownVaultId = 7;

let xKlown, klownToken, klownNft;

const klownSlpAddr = "0x9d951AC1f38307A0cbc331a491f84213c53aF11A";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Rinkeby unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_RINKEBY_API_KEY}`,
            blockNumber: 10408715,
          },
        },
      ],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x6ce798Bc8C8C93F3C312644DcbdD2ad6698622C5"],
    });

    devA = await ethers.provider.getSigner("0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a");
    devB = await ethers.provider.getSigner("0x6ce798Bc8C8C93F3C312644DcbdD2ad6698622C5");

    factory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xbbc53022Af15Bb973AD906577c84784c47C14371"
    );

    invStaking = await ethers.getContractAt("NFTXInventoryStaking", "0x05aD54B40e3be8252CB257f77d9301E9CB1A9470");

    xKlown = await ethers.getContractAt("ERC20Upgradeable", "0xD9125bf901AA9B7F03691e272Feb479907deEce9");
    klownToken = await ethers.getContractAt("ERC20Upgradeable", "0xbB6F7D658c792bFf370947D31888048b685D42d4");
    klownNft = await ethers.getContractAt("ERC721", "0x6B16004A1552FDD4a0cb5265933495a454D99d6C");

    // unstakingZap = await ethers.getContractAt(
    //   "NFTXUnstakingInventoryZap",
    //   "0x989813CDE8Efc3878F7ca595774f442CD5dE9F23"
    // );

    console.log("");
  });

  it("Should deploy unstakingzap", async () => {
    const UnstakingZap = await ethers.getContractFactory("NFTXUnstakingInventoryZap");
    unstakingZap = await UnstakingZap.deploy();
    await unstakingZap.deployed();

    await unstakingZap.setVaultFactory("0xbbc53022Af15Bb973AD906577c84784c47C14371");
    await unstakingZap.setInventoryStaking("0x05aD54B40e3be8252CB257f77d9301E9CB1A9470");
    await unstakingZap.setSushiRouterAndWeth("0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");
  });

  it("Should exclude unstakingzap from fees", async () => {
    await factory.connect(devA).setFeeExclusion(unstakingZap.address, "true");
  });

  // const mint721ForFree = async (vaultAddr, nftAddr, minter, tokenIds, tokenAmounts) => {
  //   const vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
  //   const nft = await ethers.getContractAt("ERC721", nftAddr);
  //   const fees = await vault.vaultFees();
  //   await vault.connect(devA).setFees(0, fees[1], fees[2], fees[3], fees[4]);
  //   for (let i = 0; i < tokenIds.length; i++) {
  //     await nft.connect(minter).approve(vaultAddr, tokenIds[i]);
  //   }
  //   await vault.connect(minter).mint(tokenIds, tokenAmounts);
  //   await vault.connect(devA).setFees(...fees);
  // };

  it("Should stake and unstake KLOWN", async () => {
    // let klownTokenBal = await klownToken.balanceOf(devB._address);
    // console.log("initial KLOWN bal:", formatEther(klownTokenBal));

    // await mint721ForFree(klownToken.address, klownNft.address, devB, [5], [1]);

    let klownNftBal = await klownNft.balanceOf(devB._address);
    console.log("initial klown NFT bal:", klownNftBal.toString());

    let klownTokenBal = await klownToken.balanceOf(devB._address);
    console.log("initial KLOWN bal:", formatEther(klownTokenBal), "\n");

    let xKlownBal = await xKlown.balanceOf(devB._address);
    console.log("initial xKLOWN bal:", formatEther(xKlownBal));

    // await klownToken.approve(invStaking.address, BASE.mul(100));

    // await invStaking.connect(devB).deposit(klownVaultId, BASE);

    let [maxNfts, shortByTinyAmount] = await unstakingZap.maxNftsUsingXToken(
      klownVaultId,
      devB._address,
      klownSlpAddr
    );
    console.log("values", maxNfts.toString(), shortByTinyAmount);

    let shareValue = await invStaking.xTokenShareValue(klownVaultId);
    console.log("share value:", formatEther(shareValue));

    let calculatedKlownTokens = xKlownBal.mul(shareValue).div(BASE);
    console.log("calculated KLOWN tokens:", calculatedKlownTokens.toString(), "\n");

    // xKlownBal = await xKlown.balanceOf(devB._address);
    // console.log("post-stake xKLOWN bal:", formatEther(xKlownBal), "\n");

    // let shareValue = await invStaking.xTokenShareValue(klownVaultId);
    // console.log("share value:", formatEther(shareValue));

    // let calculatedKlownTokens = xKlownBal.mul(shareValue).div(BASE);
    // console.log("calculated KLOWN tokens:", calculatedKlownTokens.toString(), "\n");

    // console.log("Sleeping for 3s...\n");
    // await sleep(3000);

    await xKlown.connect(devB).approve(unstakingZap.address, BASE.mul(100));

    // [maxNfts, oneWeiShort] = await unstakingZap.maxNftsUsingXToken(klownVaultId, devB._address);
    // console.log("values2", maxNfts.toString(), oneWeiShort);

    await unstakingZap.connect(devB).unstakeInventory(klownVaultId, 1, 0, { value: 1000000000 });

    klownNftBal = await klownNft.balanceOf(devB._address);
    console.log("post-unstake klown NFT bal:", klownNftBal.toString());

    klownTokenBal = await klownToken.balanceOf(devB._address);
    console.log("post-unstake KLOWN bal:", formatEther(klownTokenBal), "\n");

    xKlownBal = await xKlown.balanceOf(devB._address);
    console.log("post-unstake xKLOWN bal:", formatEther(xKlownBal));
  });
});
