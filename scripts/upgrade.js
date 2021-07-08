const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const notZeroAddr = "0x000000000000000000000000000000000000dead";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );

  const VaultFactory2 = await ethers.getContractFactory(
    "NFTXVaultFactoryUpgradeable2"
  );
  const vaultFactory2 = await VaultFactory2.deploy();
  await vaultFactory2.deployed();
  console.log("VaultFactory2:", vaultFactory2.address);

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
