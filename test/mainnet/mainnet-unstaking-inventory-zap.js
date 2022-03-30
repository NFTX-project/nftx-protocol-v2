const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let factory, invStaking, unstakingZap;

const avastrVaultId = 1;

let xAvastr, avastrToken, avastarsNft;

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

    invStaking = await ethers.getContractAt("NFTXInventoryStaking", "0x3E135c3E981fAe3383A5aE0d323860a34CfAB893");

    xAvastr = await ethers.getContractAt("ERC20Upgradeable", "0x66D461Ba3f1DA2b32bf5B8dca3a40B905aB7c639");
    avastrToken = await ethers.getContractAt("ERC20Upgradeable", "0xdcDc1c1cC33AA817CbDBe8F5E2390BF7cc43dc4B");
    avastarsNft = await ethers.getContractAt("ERC721", "0xF3E778F839934fC819cFA1040AabaCeCBA01e049");
  });

  it("Should deploy unstakingzap", async () => {
    const UnstakingZap = await ethers.getContractFactory("NFTXUnstakingInventoryZap");
    unstakingZap = await UnstakingZap.deploy();
    await unstakingZap.deployed();

    await unstakingZap.setVaultFactory("0xBE86f647b167567525cCAAfcd6f881F1Ee558216");
    await unstakingZap.setInventoryStaking("0x3E135c3E981fAe3383A5aE0d323860a34CfAB893");
  });

  it("Should exclude unstakingzap from fees", async () => {
    await factory.connect(dao).setFeeExclusion(unstakingZap.address, "true");
  });

  it("Should unstake AVASTR inventory", async () => {
    await xAvastr.connect(zetsu).approve(unstakingZap.address, BASE.mul(1000));

    await expectRevert(unstakingZap.connect(zetsu).unstakeInventory(avastrVaultId, 100, 0));
    await expectRevert(unstakingZap.connect(zetsu).unstakeInventory(avastrVaultId, 100, BASE.div(2)));
    await expectRevert(unstakingZap.connect(zetsu).unstakeInventory(avastrVaultId, 100, BASE));

    await expectRevert(unstakingZap.connect(zetsu).unstakeInventory(avastrVaultId, 0, BASE.add(1)));

    const runUnstakeInventoryTest = async (numNfts, remainingPortionToUnstake) => {
      let xAvastrBalInitial = await xAvastr.balanceOf(zetsu._address);
      console.log("xAVASTR balance (initial):", formatEther(xAvastrBalInitial));
      let avastrTokenBalInitial = await avastrToken.balanceOf(zetsu._address);
      console.log("AVASTR balance (initial):", formatEther(avastrTokenBalInitial));
      let avastarsNftBalInitial = await avastarsNft.balanceOf(zetsu._address);
      console.log("Avastar NFT balance (initial):", avastarsNftBalInitial.toString());

      let shareValue = await invStaking.xTokenShareValue(avastrVaultId);

      let totalStakedAvastr = BigNumber.from(shareValue).mul(xAvastrBalInitial).div(BASE);
      console.log("Total AVASTR available from xAVASTR:", formatEther(totalStakedAvastr));

      console.log("Number of Avastar NFTs to redeem:", numNfts.toString());
      console.log("Remaining potion to unstake:", formatEther(remainingPortionToUnstake));

      let expectedVTokensReturned = totalStakedAvastr
        .sub(BASE.mul(numNfts))
        .mul(remainingPortionToUnstake)
        .div(BASE);

      await unstakingZap.connect(zetsu).unstakeInventory(avastrVaultId, numNfts, remainingPortionToUnstake);

      let avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
      let avastrTokensReturned = avastrTokenBal.sub(avastrTokenBalInitial);
      let avastarsNftBal = await avastarsNft.balanceOf(zetsu._address);
      let avastarsNftsReturned = avastarsNftBal.sub(avastarsNftBalInitial);

      console.log("Expected AVASTR returned:", formatEther(expectedVTokensReturned));
      console.log("Actual AVASTR returned:", formatEther(avastrTokensReturned));

      console.log("Expected Avastar NFTs returned:", numNfts.toString());
      console.log("Actual Avastar NFTs returned:", avastarsNftsReturned.toString());

      expect(avastrTokensReturned.div(100000).mul(100000)).to.equal(
        expectedVTokensReturned.div(100000).mul(100000)
      );
      expect(avastarsNftsReturned).to.equal(numNfts);

      console.log("\nContinuing...\n");
    };

    await runUnstakeInventoryTest(0, 0);

    await runUnstakeInventoryTest(1, 0);
    await runUnstakeInventoryTest(2, 0);

    await runUnstakeInventoryTest(0, BASE.div(50));
    await runUnstakeInventoryTest(1, BASE.div(50));
    await runUnstakeInventoryTest(2, BASE.div(50));
    await runUnstakeInventoryTest(3, BASE.div(50));

    await runUnstakeInventoryTest(0, BASE);

    let avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(avastrVaultId, avastrTokenBal);
    console.log("Sleeping for 3s...\n");
    await sleep(3000);
    await runUnstakeInventoryTest(1, BASE);

    avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(avastrVaultId, avastrTokenBal);
    console.log("Sleeping for 3s...\n");
    await sleep(3000);
    await runUnstakeInventoryTest(2, BASE);

    avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(avastrVaultId, avastrTokenBal);
    console.log("Sleeping for 3s...\n");
    await sleep(3000);
    await runUnstakeInventoryTest(0, BASE.div(50).mul(49));

    avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(avastrVaultId, avastrTokenBal);
    console.log("Sleeping for 3s...\n");
    await sleep(3000);
    await runUnstakeInventoryTest(1, BASE.div(50).mul(49));

    avastrTokenBal = await avastrToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(avastrVaultId, avastrTokenBal);
    console.log("Sleeping for 3s...\n");
    await sleep(3000);
    await runUnstakeInventoryTest(2, BASE.div(50).mul(49));
  });
});
