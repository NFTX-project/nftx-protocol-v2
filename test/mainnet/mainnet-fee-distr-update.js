const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu;
let dao;
let factory, proxyController;
let lpStaking, feeDistributor;
let phaycVault, phaycNft, phaycVaultId;
let paycVault, paycNft, paycVaultId;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 15019580,
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

    proxyController = await ethers.getContractAt("MultiProxyController", "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C");

    paycVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0xa4009D8Eda6F40f549Dfc10f33F56619b9754C90");
    paycNft = await ethers.getContractAt("IERC721Upgradeable", "0x176e0Fe17314DEf59F0F06e976E1b74203be4a55");
    paycVaultId = 305;
    paycNftIds = [238, 836, 3831]
    
    /* phaycVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x0d34aaC34be3c1B4928e1574c1263Ada6603318D");
    phaycNft = await ethers.getContractAt("IERC721Upgradeable", "0xcb88735A1eAe17fF2A2aBAEC1ba03d877F4Bc055");
    phaycVaultId = 310; */

    lpStaking = await ethers.getContractAt("INFTXLPStaking", "0x688c3E4658B5367da06fd629E41879beaB538E37");
    marketplaceZap = await ethers.getContractAt("NFTXMarketplaceZap", "0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d");
    feeDistributor = await ethers.getContractAt("INFTXSimpleFeeDistributor", "0xFD8a76dC204e461dB5da4f38687AdC9CC5ae4a86");
  });

  it("Should upgrade contracts", async () => {
    // Upgrade fee distributor
    const FeeDistrImpl = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
    const feeDistrImpl = await FeeDistrImpl.deploy();
    await feeDistrImpl.deployed();

    await proxyController.connect(dao).upgradeProxyTo(1, feeDistrImpl.address);

    // Upgrade LP staking
    const LPStakingImpl = await ethers.getContractFactory("NFTXLPStaking");
    const lpStakingImpl = await LPStakingImpl.deploy();
    await lpStakingImpl.deployed();

    await proxyController.connect(dao).upgradeProxyTo(2, lpStakingImpl.address);

    // Upgrade inventory staking
    const InvStakingImpl = await ethers.getContractFactory("NFTXInventoryStaking");
    const invStakingImpl = await InvStakingImpl.deploy();
    await invStakingImpl.deployed();

    await proxyController.connect(dao).upgradeProxyTo(5, invStakingImpl.address);

    // Upgrade vault (after other upgrades)
    const VaultImpl = await ethers.getContractFactory("NFTXVaultUpgradeable");
    const vaultImpl = await VaultImpl.deploy();
    await vaultImpl.deployed();

    await factory.connect(dao).upgradeChildTo(vaultImpl.address);
  });

  it("Should claim existing LP fees", async () => {
    await lpStaking.connect(zetsu).claimRewards(paycVaultId);
  });

  it("Should not distribute fees on mint", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance before mint:", formatEther(feeDistribPaycBalA));

    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance before mint:", formatEther(zetsuPaycBalA));

    let lpStakingPaycValA = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance before mint:", formatEther(lpStakingPaycValA));

    await paycVault.connect(zetsu).mint([paycNftIds[0]], [1]);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance after mint:", formatEther(feeDistribPaycBalB));

    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance after mint:", formatEther(zetsuPaycBalB));

    let lpStakingPaycValB = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance after mint:", formatEther(lpStakingPaycValB));

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(10).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.add(BASE.mul(90).div(100)));
    expect(lpStakingPaycValB).to.equal(lpStakingPaycValA);
  });

  //TODO: should distribute fees on inventory stake

  it("Should not distribute fees on redeem", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance before mint:", formatEther(feeDistribPaycBalA));

    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance before mint:", formatEther(zetsuPaycBalA));

    let lpStakingPaycValA = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance before mint:", formatEther(lpStakingPaycValA));

    await paycVault.connect(zetsu).redeem(1, []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance after redeem:", formatEther(feeDistribPaycBalB));

    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance after redeem:", formatEther(zetsuPaycBalB));

    let lpStakingPaycValB = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance after redeem:", formatEther(lpStakingPaycValB));

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.sub(BASE.mul(104).div(100)));
    expect(lpStakingPaycValB).to.equal(lpStakingPaycValA);
  });

  //TODO: should distribute fees on liquidity stake

  it("Should not distribute fees on swap", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance before mint:", formatEther(feeDistribPaycBalA));

    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance before mint:", formatEther(zetsuPaycBalA));

    let lpStakingPaycValA = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance before mint:", formatEther(lpStakingPaycValA));

    await paycVault.connect(zetsu).swap([paycNftIds[1]], [1], []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    console.log("FeeDistrib PAYC balance after redeem:", formatEther(feeDistribPaycBalB));

    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    console.log("Zetsu PAYC balance after redeem:", formatEther(zetsuPaycBalB));

    let lpStakingPaycValB = await paycVault.balanceOf(lpStaking.address);
    console.log("LPStaking PAYC balance after redeem:", formatEther(lpStakingPaycValB));

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.sub(BASE.mul(4).div(100)));
    expect(lpStakingPaycValB).to.equal(lpStakingPaycValA);
  });

  //TODO: should distribute fees on inventory unstake

  //TODO: redeem

  //TODO: should distribute fees on liquidity unstake

  //TODO: redeem

  //TODO: should distribute fees on liquidity fee claim

});
