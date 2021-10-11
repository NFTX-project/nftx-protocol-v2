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

  const MarketZap = await ethers.getContractFactory(
    "PalmNFTXMarketplaceZap"
  );
  const zap = await MarketZap.deploy("0xe01Cf5099e700c282A56E815ABd0C4948298Afae", "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");
  await zap.deployed();
  console.log("Marketplace Zap:", zap.address);
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
