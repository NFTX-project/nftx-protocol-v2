const { expect } = require("chai");
const { expectRevert } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");


const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, kongzHolder;
let dao, dev;

let nftx;
let zap, stakingZap;
let staking;
let erc721;
let kongz;
let feeDistrib;
let controller;
let provider;
const vaults = [];

describe("Marketplace Zap Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14083573,
          },
        },
      ],
    });

    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];
    console.log(primary.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xb3ffd0f321abde1740f6e13be273348baad24291"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"],
    });

    kongzHolder = await ethers.provider.getSigner(
      "0xb3ffd0f321abde1740f6e13be273348baad24291"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );
    dev = await ethers.provider.getSigner(
      "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"
    );
    vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x5A235C0b4cB8d0e80a5c3bF4d2faD5c32E440884"
    );
    vaults.push(vault);

    nftx = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    kongz = await ethers.getContractAt(
      "IERC721",
      "0x57a204AA1042f6E66DD7730813f4024114d74f37"
    );
    feeDistrib = await ethers.getContractAt(
      "NFTXSimpleFeeDistributor",
      "0xFD8a76dC204e461dB5da4f38687AdC9CC5ae4a86"
    );

    zap = await ethers.getContractAt("NFTXMarketplaceZap", "0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d");
    stakingZap = await ethers.getContractAt("NFTXStakingZap", "0x7a5e0B4069709cF4D02423b8cafDc608f4436791");
  });

  it("Should not successfully swap before fee distributor upgrade", async () => {
    const assetAddress = await vaults[0].assetAddress();
    expect(await kongz.ownerOf(607)).to.equal(await kongzHolder.getAddress())

    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x6d150646512174e191f6df5746a48b68d48020cb")
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountOut = await vaults[0].randomSwapFee();
    const amountETH = await router.getAmountIn(amountOut, reserve1, reserve0);
    await expectRevert(zap.connect(kongzHolder).buyAndSwap721(23, [607], [], [await router.WETH(), vaults[0].address], await kongzHolder.getAddress(), {value: amountETH, gasLimit: 400000}));
  })

  it("Should upgrade the Fee Distributor", async () => {
    let NewFeeDistro = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
    let feeDistro = await NewFeeDistro.connect(alice).deploy();
    await feeDistro.deployed();
    let proxyAdmin = await ethers.getContractAt("MultiProxyController", "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C");
    await proxyAdmin.connect(dao).upgradeProxyTo(1, feeDistro.address, {gasLimit: 150000});
  });

  it("Should successfully buy and swap 721", async () => {
    const assetAddress = await vaults[0].assetAddress();
    expect(await kongz.ownerOf(607)).to.equal(await kongzHolder.getAddress())

    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x6d150646512174e191f6df5746a48b68d48020cb")
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountOut = await vaults[0].randomSwapFee();
    const amountETH = await router.getAmountIn(amountOut, reserve1, reserve0);
    let preBal = await ethers.provider.getBalance(kongzHolder.getAddress());
    console.log("fuxk")
    await zap.connect(kongzHolder).buyAndSwap721(23, [607], [], [await router.WETH(), vaults[0].address], await kongzHolder.getAddress(), {value: amountETH});
    let postBal = await ethers.provider.getBalance(kongzHolder.getAddress());
    console.log("fuxk")

    expect(await ethers.provider.getBalance(zap.address)).to.equal(BigNumber.from(0));
    expect(await vaults[0].balanceOf(zap.address)).to.equal(BigNumber.from(0));
    expect(preBal).to.not.equal(postBal);
    expect(postBal).to.be.lt(preBal.sub(amountETH));

    expect(await kongz.ownerOf(906)).to.equal(await kongzHolder.getAddress())
  })
});
