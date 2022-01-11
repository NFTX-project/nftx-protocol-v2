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

  const LPStaking = await ethers.getContractFactory("NFTXLPStaking");
  const lpStakingImpl = await LPStaking.deploy();
  await lpStakingImpl.deployed();
  console.log("NFTXLPStaking impl:", lpStakingImpl.address);

  const rinkebyMultiProxyContr = "0xFc542C7fEA1da20E1195b2476ae35db50925515C";

  const proxyController = await ethers.getContractAt(
    "MultiProxyController",
    rinkebyMultiProxyContr
  );

  console.log("Upgrading lp staking contract...");

  await proxyController.upgradeProxyTo(2, lpStakingImpl.address, {
    gasLimit: "300000",
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
