const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  let factory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0xe01Cf5099e700c282A56E815ABd0C4948298Afae"
  );

  let proxyController = await ethers.getContractAt(
    "MultiProxyController",
    "0xbde65406B20ADb4ba9D88908187Bc9460fF24da9"
  );

 
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
