const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu, dao, dev;
let factory, proxyController;
let inventoryStaking, lpStaking, stakingZap, feeDistributor;
let paycVault, paycNft, paycVaultId, paycNftIds;

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
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xdea9196dcdd2173d6e369c2acc0facc83fd9346a"],
    });

    zetsu = await ethers.provider.getSigner("0xc6c2d5ee69745a1e9f2d1a06e0ef0788bd924302");
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2");
    dev = await ethers.provider.getSigner("0xdea9196dcdd2173d6e369c2acc0facc83fd9346a");

    factory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );

    proxyController = await ethers.getContractAt(
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );

    paycVault = await ethers.getContractAt("NFTXVaultUpgradeable", "0xa4009D8Eda6F40f549Dfc10f33F56619b9754C90");
    paycNft = await ethers.getContractAt("IERC721Upgradeable", "0x176e0Fe17314DEf59F0F06e976E1b74203be4a55");
    paycVaultId = 305;
    paycNftIds = [238, 836, 3831];
    xPayc = await ethers.getContractAt("IERC20Upgradeable", "0x4786d62EdF0DC42D905107f8b04BbC2779aFE90d");
    xPaycWeth = await ethers.getContractAt("IERC20Upgradeable", "0x50414dAa5CFE1fBe65d4b7bDF813f3256b968384");

    inventoryStaking = await ethers.getContractAt(
      "NFTXInventoryStaking",
      "0x3E135c3E981fAe3383A5aE0d323860a34CfAB893"
    );
    lpStaking = await ethers.getContractAt("NFTXLPStaking", "0x688c3E4658B5367da06fd629E41879beaB538E37");
    stakingZap = await ethers.getContractAt("NFTXStakingZap", "0x7a5e0B4069709cF4D02423b8cafDc608f4436791");
    marketplaceZap = await ethers.getContractAt(
      "NFTXMarketplaceZap",
      "0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d"
    );
    feeDistributor = await ethers.getContractAt(
      "INFTXSimpleFeeDistributor",
      "0xFD8a76dC204e461dB5da4f38687AdC9CC5ae4a86"
    );
  });

  it("Should lower staking locktimes for tests", async () => {
    await inventoryStaking.connect(dao).setInventoryLockTimeErc20(2);
    await stakingZap.connect(dev).setLPLockTime(2);
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
    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);

    await paycVault.connect(zetsu).mint([paycNftIds[0]], [1]);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(10).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.add(BASE.mul(90).div(100)));
    expect(xSlpRewardBalB).to.equal(xSlpRewardBalA);
    expect(xPaycShareValB).to.equal(xPaycShareValA);
  });

  it("Should distribute fees on inventory stake", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyA = await xPayc.totalSupply();

    let stakeAmount = BASE.div(2);
    await paycVault.connect(zetsu).approve(inventoryStaking.address, BASE.mul(10));
    await inventoryStaking.connect(zetsu).deposit(paycVaultId, stakeAmount);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyB = await xPayc.totalSupply();

    expect(feeDistribPaycBalB.lt(feeDistribPaycBalA)).to.equal(true);
    expect(xSlpRewardBalB.gt(xSlpRewardBalA)).to.equal(true);
    expect(xPaycShareValB.gt(xPaycShareValA)).to.equal(true);

    let feeDistribPaycBalDif = feeDistribPaycBalA.sub(feeDistribPaycBalB);
    let xSlpRewardBalDif = xSlpRewardBalB.sub(xSlpRewardBalA);
    expect(xSlpRewardBalDif.gt(feeDistribPaycBalDif.mul(79).div(100))).to.equal(true);
    expect(xSlpRewardBalDif.lt(feeDistribPaycBalDif.mul(81).div(100))).to.equal(true);

    let xPaycValA = xPaycSupplyA.mul(xPaycShareValA).div(BASE);
    let xPaycValB = xPaycSupplyB.mul(xPaycShareValB).div(BASE);
    let xPaycValDif = xPaycValB.sub(xPaycValA);
    expect(xPaycValDif.sub(stakeAmount).gt(feeDistribPaycBalDif.mul(19).div(100))).to.equal(true);
    expect(xPaycValDif.sub(stakeAmount).lt(feeDistribPaycBalDif.mul(21).div(100))).to.equal(true);
  });

  it("Should not distribute fees on redeem", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);

    await paycVault.connect(zetsu).redeem(1, []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.sub(BASE.mul(104).div(100)));
    expect(xSlpRewardBalB).to.equal(xSlpRewardBalA);
  });

  it("Should distribute fees on liquidity stake", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyA = await xPayc.totalSupply();

    await paycNft.connect(zetsu).setApprovalForAll(stakingZap.address, true);
    await stakingZap.connect(zetsu).addLiquidity721ETH(paycVaultId, [paycNftIds[1]], 0, {
      value: parseEther("0.05"),
      gasLimit: "1000000",
    });

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyB = await xPayc.totalSupply();

    expect(feeDistribPaycBalB.lt(feeDistribPaycBalA)).to.equal(true);
    expect(xSlpRewardBalB.gt(xSlpRewardBalA)).to.equal(true);
    expect(xPaycShareValB.gt(xPaycShareValA)).to.equal(true);

    let feeDistribPaycBalDif = feeDistribPaycBalA.sub(feeDistribPaycBalB);
    let xSlpRewardBalDif = xSlpRewardBalB.sub(xSlpRewardBalA);
    expect(xSlpRewardBalDif.gt(feeDistribPaycBalDif.mul(79).div(100))).to.equal(true);
    expect(xSlpRewardBalDif.lt(feeDistribPaycBalDif.mul(81).div(100))).to.equal(true);

    let xPaycValA = xPaycSupplyA.mul(xPaycShareValA).div(BASE);
    let xPaycValB = xPaycSupplyB.mul(xPaycShareValB).div(BASE);
    let xPaycValDif = xPaycValB.sub(xPaycValA);
    expect(xPaycValDif.gt(feeDistribPaycBalDif.mul(19).div(100))).to.equal(true);
    expect(xPaycValDif.lt(feeDistribPaycBalDif.mul(21).div(100))).to.equal(true);
  });

  it("Should not distribute fees on swap", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);

    await paycVault.connect(zetsu).swap([paycNftIds[2]], [1], []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
    expect(zetsuPaycBalB).to.equal(zetsuPaycBalA.sub(BASE.mul(4).div(100)));
    expect(xSlpRewardBalB).to.equal(xSlpRewardBalA);
  });

  it("Should distribute fees on inventory unstake", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyA = await xPayc.totalSupply();

    let xTokenShareValueA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let adjustedXTokenShareValueA = await inventoryStaking.adjustedXTokenShareValue(paycVaultId);
    expect(adjustedXTokenShareValueA.gt(xTokenShareValueA)).to.equal(true);

    let unstakeAmount = BASE.div(10);
    let unstakeAmountUnderlying = unstakeAmount.mul(xTokenShareValueA).div(BASE);
    await sleep(3000);
    await inventoryStaking.connect(zetsu).withdraw(paycVaultId, unstakeAmount);

    let xTokenShareValueB = await inventoryStaking.adjustedXTokenShareValue(paycVaultId);
    expect(adjustedXTokenShareValueA).to.equal(xTokenShareValueB);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyB = await xPayc.totalSupply();

    expect(feeDistribPaycBalB.lt(feeDistribPaycBalA)).to.equal(true);
    expect(xSlpRewardBalB.gt(xSlpRewardBalA)).to.equal(true);
    expect(xPaycShareValB.gt(xPaycShareValA)).to.equal(true);

    let feeDistribPaycBalDif = feeDistribPaycBalA.sub(feeDistribPaycBalB);
    let xSlpRewardBalDif = xSlpRewardBalB.sub(xSlpRewardBalA);
    expect(xSlpRewardBalDif.gt(feeDistribPaycBalDif.mul(79).div(100))).to.equal(true);
    expect(xSlpRewardBalDif.lt(feeDistribPaycBalDif.mul(81).div(100))).to.equal(true);

    let xPaycValA = xPaycSupplyA.mul(xPaycShareValA).div(BASE);
    let xPaycValB = xPaycSupplyB.mul(xPaycShareValB).div(BASE);
    let xPaycValDif = xPaycValB.sub(xPaycValA);
    expect(xPaycValDif.add(unstakeAmountUnderlying).gt(feeDistribPaycBalDif.mul(19).div(100))).to.equal(true);
    expect(xPaycValDif.add(unstakeAmountUnderlying).lt(feeDistribPaycBalDif.mul(21).div(100))).to.equal(true);
  });

  it("Should redeem again to accrue fees in distributor", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);

    await paycVault.connect(zetsu).redeem(1, []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
  });

  it("Should distribute fees on liquidity rewards claim", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyA = await xPayc.totalSupply();

    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    let adjustedDividendOfZetsuA = await lpStaking.adjustedDividendOf(paycVaultId, zetsu._address);

    await lpStaking.connect(zetsu).claimRewards(paycVaultId);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyB = await xPayc.totalSupply();

    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    let zetsuPaycBalDif = zetsuPaycBalB.sub(zetsuPaycBalA);
    expect(zetsuPaycBalDif).to.equal(adjustedDividendOfZetsuA);

    expect(feeDistribPaycBalB.lt(feeDistribPaycBalA)).to.equal(true);
    expect(xSlpRewardBalB.gt(xSlpRewardBalA)).to.equal(true);
    expect(xPaycShareValB.gt(xPaycShareValA)).to.equal(true);

    let feeDistribPaycBalDif = feeDistribPaycBalA.sub(feeDistribPaycBalB);
    let xSlpRewardBalDif = xSlpRewardBalB.sub(xSlpRewardBalA);
    expect(xSlpRewardBalDif.add(zetsuPaycBalDif).gt(feeDistribPaycBalDif.mul(79).div(100))).to.equal(true);
    expect(xSlpRewardBalDif.add(zetsuPaycBalDif).lt(feeDistribPaycBalDif.mul(81).div(100))).to.equal(true);

    let xPaycValA = xPaycSupplyA.mul(xPaycShareValA).div(BASE);
    let xPaycValB = xPaycSupplyB.mul(xPaycShareValB).div(BASE);
    let xPaycValDif = xPaycValB.sub(xPaycValA);
    expect(xPaycValDif.gt(feeDistribPaycBalDif.mul(19).div(100))).to.equal(true);
    expect(xPaycValDif.lt(feeDistribPaycBalDif.mul(21).div(100))).to.equal(true);
  });

  it("Should redeem again to accrue fees in distributor", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);

    await paycVault.connect(zetsu).redeem(1, []);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);

    expect(feeDistribPaycBalB).to.equal(feeDistribPaycBalA.add(BASE.mul(4).div(100)));
  });

  it("Should distribute fees on liquidity unstake", async () => {
    let feeDistribPaycBalA = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValA = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalA = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyA = await xPayc.totalSupply();

    let zetsuPaycBalA = await paycVault.balanceOf(zetsu._address);
    let adjustedDividendOfZetsuA = await lpStaking.adjustedDividendOf(paycVaultId, zetsu._address);

    let xPaycWethBal = await xPaycWeth.balanceOf(zetsu._address);
    await sleep(3000);
    await lpStaking.connect(zetsu).withdraw(paycVaultId, xPaycWethBal);

    let feeDistribPaycBalB = await paycVault.balanceOf(feeDistributor.address);
    let xPaycShareValB = await inventoryStaking.xTokenShareValue(paycVaultId);
    let xSlpRewardBalB = await paycVault.balanceOf(xPaycWeth.address);
    let xPaycSupplyB = await xPayc.totalSupply();

    let zetsuPaycBalB = await paycVault.balanceOf(zetsu._address);
    let zetsuPaycBalDif = zetsuPaycBalB.sub(zetsuPaycBalA);
    expect(zetsuPaycBalDif.sub(1).lte(adjustedDividendOfZetsuA)).to.equal(true);
    expect(zetsuPaycBalDif.add(1).gte(adjustedDividendOfZetsuA)).to.equal(true);

    expect(feeDistribPaycBalB.lt(feeDistribPaycBalA)).to.equal(true);
    expect(xSlpRewardBalB.gt(xSlpRewardBalA)).to.equal(true);
    expect(xPaycShareValB.gt(xPaycShareValA)).to.equal(true);

    let feeDistribPaycBalDif = feeDistribPaycBalA.sub(feeDistribPaycBalB);
    let xSlpRewardBalDif = xSlpRewardBalB.sub(xSlpRewardBalA);
    expect(xSlpRewardBalDif.add(zetsuPaycBalDif).gt(feeDistribPaycBalDif.mul(79).div(100))).to.equal(true);
    expect(xSlpRewardBalDif.add(zetsuPaycBalDif).lt(feeDistribPaycBalDif.mul(81).div(100))).to.equal(true);

    let xPaycValA = xPaycSupplyA.mul(xPaycShareValA).div(BASE);
    let xPaycValB = xPaycSupplyB.mul(xPaycShareValB).div(BASE);
    let xPaycValDif = xPaycValB.sub(xPaycValA);
    expect(xPaycValDif.gt(feeDistribPaycBalDif.mul(19).div(100))).to.equal(true);
    expect(xPaycValDif.lt(feeDistribPaycBalDif.mul(21).div(100))).to.equal(true);
  });
});
