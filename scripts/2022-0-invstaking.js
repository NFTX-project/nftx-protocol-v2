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

  const rinkebyVaultFactoryAddr = "0xbbc53022Af15Bb973AD906577c84784c47C14371";

  const InventoryStaking = await ethers.getContractFactory(
    "NFTXInventoryStaking"
  );
  const inventoryStaking = await upgrades.deployProxy(
    InventoryStaking,
    [rinkebyVaultFactoryAddr],
    {
      initializer: "__NFTXInventoryStaking_init",
      unsafeAllow: "delegatecall",
    }
  );
  await inventoryStaking.deployed();

  console.log("InventoryStaking:", inventoryStaking.address);
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
