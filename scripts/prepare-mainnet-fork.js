const { expect } = require("chai");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, kiwi;
let dao;

let nftx;
let zap;
let staking;
let erc721;
let feeDistrib;
let controller;
let liveBugUser;
const vaults = [];

async function main() {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 12963200,
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
      params: ["0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8B0C8c18993a31F57e60d81761F532Ef14633153"],
    });
    
    kiwi = await ethers.provider.getSigner(
      "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );
    liveBugUser = await ethers.provider.getSigner(
      "0x8B0C8c18993a31F57e60d81761F532Ef14633153"
    );

    nftx = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    staking = await ethers.getContractAt(
      "NFTXLPStaking",
      "0x688c3E4658B5367da06fd629E41879beaB538E37"
    );
    controller = await ethers.getContractAt(
      "ProxyController",
      "0x4333d66Ec59762D1626Ec102d7700E64610437Df"
    );

    let Zap = await ethers.getContractFactory("NFTXStakingZap");

    zap = await Zap.deploy(
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F" /* Sushi Router */
    );
    console.log("Zap deployed: ", zap.address);
    await zap.deployed();

    await nftx.connect(dao).setFeeExclusion(zap.address, true);

    expect(await zap.nftxFactory()).to.equal(nftx.address);
    expect(await zap.lpStaking()).to.equal(staking.address);
    expect(await zap.sushiRouter()).to.equal(
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    );

    let NewStaking = await ethers.getContractFactory("NFTXLPStaking");
    let newStaking = await NewStaking.deploy();
    await newStaking.deployed();
    console.log("New staking Impl deployed: ", newStaking.address);
    await controller.connect(dao).upgradeProxyTo(3, newStaking.address);
    await staking.assignNewImpl();

    vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x114f1388fab456c4ba31b1850b244eedcd024136"
    );
    vaults.push(vault);
    const assetAddress = await vaults[0].assetAddress();
    const coolCats = await ethers.getContractAt("ERC721", assetAddress);

    await coolCats.connect(kiwi).setApprovalForAll(zap.address, true);

    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x0225e940deecc32a8d7c003cfb7dae22af18460c")
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountToLP = BASE.mul(2); //.sub(mintFee.mul(5)) no fee anymore
    const amountETH = await router.quote(amountToLP, reserve0, reserve1)
    await vaults[0].connect(kiwi).approve(zap.address, BASE.mul(1000))
    await zap.connect(kiwi).addLiquidity721ETH(31, [9852,9838], amountETH.sub(500), {value: amountETH})
    const postDepositBal = await pair.balanceOf(staking.address);
    console.log("ZApped")
  }


main()
.then(() => {
  console.log("\nDeployment completed successfully ✓");
  process.exit(0);
})
.catch((error) => {
  console.log("\nDeployment failed ✗");
  console.error(error);
  process.exit(1);
});
