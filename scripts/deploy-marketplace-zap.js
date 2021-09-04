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
    "NFTXMarketplaceZap"
  );
  const zap = await MarketZap.deploy("0x8c9ECD518C7805e82cd6DC148e1c8902cb5d3655", "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");
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
