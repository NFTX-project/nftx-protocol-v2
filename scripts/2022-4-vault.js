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

  const VaultTemplate = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const vaultTemplateImpl = await VaultTemplate.deploy();
  await vaultTemplateImpl.deployed();
  console.log("NFTXVaultUpgradeable impl:", vaultTemplateImpl.address);

  const rinkebyVaultFactory = "0xbbc53022Af15Bb973AD906577c84784c47C14371";

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    rinkebyVaultFactory
  );

  console.log("Upgrading vault template contract...");

  await vaultFactory.upgradeChildTo(vaultTemplateImpl.address, {
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
