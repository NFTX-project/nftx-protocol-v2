const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );

  // const proxyController = await ethers.getContractAt("ProxyController", "0xD6f0Dd9400E89A7062a20f8E06bf8C083b184508");
  // const NFTXLPStaking = await ethers.getContractFactory("NFTXLPStaking");
  // const lpStaking = await NFTXLPStaking.deploy()
  // await lpStaking.deployed()
  // await proxyController.upgradeProxyTo(3, lpStaking.address)
  // console.log("Upgraded")


  const StakingZap = await ethers.getContractFactory("NFTXStakingZap");
  const stakingZap = await StakingZap.deploy("0xbbc53022Af15Bb973AD906577c84784c47C14371", "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506")
  await stakingZap.deployed()
  console.log("Staking Zap: ", stakingZap.address)

  const factory = await ethers.getContractAt("NFTXVaultFactoryUpgradeable", "0xbbc53022Af15Bb973AD906577c84784c47C14371")
  await factory.setFeeExclusion(stakingZap.address, true);
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
