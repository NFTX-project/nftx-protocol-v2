const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let invStaking, multiController, stakingZap, vaultFactory, lpStaking;

const coolVaultId = 31;
let xCool, coolToken;

const hdpunkVaultId = 26;
let hdpunkNft, hdpunkToken, xHdpunk, xHdpunkWeth;
const hdpunkIds = [920, 3392, 6392, 6666, 9865];

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

    multiController = await ethers.getContractAt(
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );

    vaultFactory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );

    lpStaking = await ethers.getContractAt("NFTXLPStaking", "0x688c3E4658B5367da06fd629E41879beaB538E37");

    xCool = await ethers.getContractAt("ERC20Upgradeable", "0xb31858B8a49DD6099869B034DA14a7a9CAd1382b");
    coolToken = await ethers.getContractAt("ERC20Upgradeable", "0x114f1388fAB456c4bA31B1850b244Eedcd024136");

    hdpunkNft = await ethers.getContractAt("ERC721", "0x3E86e26915403ae0E1CFf7E7b23377b3a30104A0");
    hdpunkToken = await ethers.getContractAt("ERC20Upgradeable", "0x42B4dF7e402A71EAE743c6C5410CE3BBb63aEf22");
    xHdpunk = await ethers.getContractAt("ERC20Upgradeable", "0x47be8559ecBAEb84C759c215497d40334f97D754");
    xHdpunkWeth = await ethers.getContractAt("ERC20Upgradeable", "0x23248B4E320F4E4076eF621f4a2B29935De27A1E");

    await dao.sendTransaction({
      to: zetsu._address,
      value: ethers.utils.parseEther("10.0"),
    });
  });

  it("Should upgrade inventorystaking", async () => {
    const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
    let inventoryStakingImpl = await InventoryStaking.deploy();
    await inventoryStakingImpl.deployed();

    await multiController.connect(dao).upgradeProxyTo(5, inventoryStakingImpl.address);
  });

  it("Should set inventoryLockTimeErc20", async () => {
    await expectRevert(invStaking.connect(zetsu).setInventoryLockTimeErc20("2"));
    await invStaking.connect(dao).setInventoryLockTimeErc20(2);
  });

  it("Should stake coolToken with timelock", async () => {
    await coolToken.connect(zetsu).approve(invStaking.address, BASE.mul(1000));

    let coolTokenBal = await coolToken.balanceOf(zetsu._address);
    console.log("COOL balance (initial):", formatEther(coolTokenBal));

    let xCoolBal = await xCool.balanceOf(zetsu._address);
    console.log("xCOOL balance (initial):", formatEther(xCoolBal));

    let timelockedUntil = await invStaking.timelockUntil(coolVaultId, zetsu._address);
    console.log("timelockedUntil (initial):", timelockedUntil.toString());

    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    timelockedUntil = await invStaking.timelockUntil(coolVaultId, zetsu._address);
    console.log("timelockedUntil:", timelockedUntil.toString());

    xCoolBal = await xCool.balanceOf(zetsu._address);
    console.log("xCOOL balance (initial):", formatEther(xCoolBal));

    await expectRevert(invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal));

    console.log("Sleeping for 3s...\n");
    await sleep(3000);

    await invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal);
  });

  it("Should deploy and connect timelockexcludelist", async () => {
    const TimelockExcludeList = await ethers.getContractFactory("TimelockExcludeList");
    timelockExcludeList = await TimelockExcludeList.deploy();
    await timelockExcludeList.deployed();

    await timelockExcludeList.transferOwnership(dao._address);

    await invStaking.connect(dao).setTimelockExcludeList(timelockExcludeList.address);
  });

  it("Should exclude address for all vaults", async () => {
    await expectRevert(timelockExcludeList.connect(zetsu).setExcludeFromAll(zetsu._address, true));

    await timelockExcludeList.connect(dao).setExcludeFromAll(zetsu._address, true);

    let coolTokenBal = await coolToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    let xCoolBal = await xCool.balanceOf(zetsu._address);

    await invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal);

    await timelockExcludeList.connect(dao).setExcludeFromAll(zetsu._address, false);

    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    xCoolBal = await xCool.balanceOf(zetsu._address);

    await expectRevert(invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal));

    console.log("Sleeping for 3s...\n");
    await sleep(3000);

    await invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal);
  });

  it("Should exclude address from single vault", async () => {
    await expectRevert(timelockExcludeList.connect(zetsu).setExcludeFromVault(zetsu._address, coolVaultId, true));

    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, coolVaultId, true);

    let coolTokenBal = await coolToken.balanceOf(zetsu._address);
    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    let xCoolBal = await xCool.balanceOf(zetsu._address);

    await invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal);

    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, coolVaultId, false);
    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, coolVaultId + 1, true);

    await invStaking.connect(zetsu).deposit(coolVaultId, coolTokenBal.div(2));

    xCoolBal = await xCool.balanceOf(zetsu._address);

    await expectRevert(invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal));

    console.log("Sleeping for 3s...\n");
    await sleep(3000);

    await invStaking.connect(zetsu).withdraw(coolVaultId, xCoolBal);
    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, coolVaultId + 1, false);
  });

  it("Should deploy and connect new stakingzap", async () => {
    let StakingZap = await ethers.getContractFactory("NFTXStakingZap");
    stakingZap = await StakingZap.deploy(vaultFactory.address, "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    await stakingZap.deployed();

    await stakingZap.assignStakingContracts();
    await stakingZap.transferOwnership(dao._address);

    await vaultFactory.connect(dao).setFeeExclusion(stakingZap.address, true);
    await vaultFactory.connect(dao).setZapContract(stakingZap.address);

    await stakingZap.connect(dao).setTimelockExcludeList(timelockExcludeList.address);
  });

  it("Should use new stakingzap for inventory staking", async () => {
    await hdpunkNft.connect(zetsu).setApprovalForAll(stakingZap.address, true);

    await stakingZap.connect(dao).setInventoryLockTime(2);

    await stakingZap.connect(zetsu).provideInventory721(hdpunkVaultId, [hdpunkIds[0]]);

    let xHdpunkBal = await xHdpunk.balanceOf(zetsu._address);

    await expectRevert(invStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkBal));

    console.log("Sleeping for 3s...\n");
    await sleep(3000);

    await invStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkBal);
  });

  it("Should exclude address for all vaults with stakingzap", async () => {
    await timelockExcludeList.connect(dao).setExcludeFromAll(zetsu._address, true);

    await stakingZap.connect(zetsu).provideInventory721(hdpunkVaultId, [hdpunkIds[1]]);

    let xHdpunkBal = await xHdpunk.balanceOf(zetsu._address);

    await invStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkBal);

    await timelockExcludeList.connect(dao).setExcludeFromAll(zetsu._address, false);
  });

  it("Should use new stakingzap for liquidity staking", async () => {
    await stakingZap.connect(dao).setLPLockTime(2);

    await stakingZap
      .connect(zetsu)
      .addLiquidity721ETH(hdpunkVaultId, [hdpunkIds[2]], parseEther("0.01"), { value: parseEther("0.04") });

    let xHdpunkWethBal = await xHdpunkWeth.balanceOf(zetsu._address);

    await expectRevert(lpStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkWethBal));

    console.log("Sleeping for 3s...\n");
    await sleep(3000);

    await lpStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkWethBal);
  });

  it("Should exclude address for vault with stakingzap for liquidity staking", async () => {
    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, hdpunkVaultId, true);

    await stakingZap
      .connect(zetsu)
      .addLiquidity721ETH(hdpunkVaultId, [hdpunkIds[3]], parseEther("0.01"), { value: parseEther("0.04") });

    let xHdpunkWethBal = await xHdpunkWeth.balanceOf(zetsu._address);

    await lpStaking.connect(zetsu).withdraw(hdpunkVaultId, xHdpunkWethBal);

    await timelockExcludeList.connect(dao).setExcludeFromVault(zetsu._address, hdpunkVaultId, false);
  });
});
