const {BigNumber} = require("@ethersproject/bignumber");
const {ethers, upgrades} = require("hardhat");


async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );

  const VaultCreationZap = await ethers.getContractFactory(
    "NFTXVaultCreationZap"
  );
  const zap = await VaultCreationZap.deploy("0xe01Cf5099e700c282A56E815ABd0C4948298Afae");
  await zap.deployed();
  console.log("Vault Creation Zap:", zap.address);
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