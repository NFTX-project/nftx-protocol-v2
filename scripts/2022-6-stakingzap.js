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

  const rinkebyVaultFactory = "0xbbc53022Af15Bb973AD906577c84784c47C14371";
  const rinkebySushiRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  const StakingZap = await ethers.getContractFactory("NFTXStakingZap");
  const stakingZap = await StakingZap.deploy(
    rinkebyVaultFactory,
    rinkebySushiRouter
  );
  await stakingZap.deployed();
  console.log("Staking Zap: ", stakingZap.address);

  console.log("Setting lp lock time...");
  await stakingZap.setLPLockTime(600);

  console.log("Setting inventory lock time...");
  await stakingZap.setInventoryLockTime(800);

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    rinkebyVaultFactory
  );

  console.log("Setting fee exclusion...");
  await vaultFactory.setFeeExclusion(stakingZap.address, true, {
    gasLimit: 100000,
  });
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
