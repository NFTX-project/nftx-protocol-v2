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

  const rinkebyFeeDistributor = "0x29F52f4Df3Ae7bd736305c035d45EBa563CD7A2f";
  const rinkebyInvStaking = "0x05aD54B40e3be8252CB257f77d9301E9CB1A9470";

  const feeDistributor = await ethers.getContractAt(
    "NFTXSimpleFeeDistributor",
    rinkebyFeeDistributor
  );

  console.log("Upgrading inventory staking address...");

  await feeDistributor.setInventoryStakingAddress(rinkebyInvStaking, {
    gasLimit: 100000,
  });

  console.log("Updating inventory staking fee receiver address...");

  await feeDistributor.changeReceiverAddress(1, rinkebyInvStaking, true, {
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
