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

  const FeeDistributor = await ethers.getContractFactory(
    "NFTXSimpleFeeDistributor"
  );
  const feeDistributorImpl = await FeeDistributor.deploy();
  await feeDistributorImpl.deployed();
  console.log("NFTXSimpleFeeDistributor impl:", feeDistributorImpl.address);

  const rinkebyMultiProxyContr = "0xFc542C7fEA1da20E1195b2476ae35db50925515C";

  const proxyController = await ethers.getContractAt(
    "MultiProxyController",
    rinkebyMultiProxyContr
  );

  console.log("Upgrading simple fee distributor contract...");

  await proxyController.upgradeProxyTo(1, feeDistributorImpl.address, {
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
