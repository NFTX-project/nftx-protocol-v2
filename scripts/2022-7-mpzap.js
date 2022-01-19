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

  const rinkebyVaultFactory = "0xbbc53022Af15Bb973AD906577c84784c47C14371";
  const rinkebySushiRouter = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  const MarketplaceZap = await ethers.getContractFactory("NFTXMarketplaceZap");
  const marketplaceZap = await MarketplaceZap.deploy(
    rinkebyVaultFactory,
    rinkebySushiRouter
  );
  await marketplaceZap.deployed();
  console.log("MarketplaceZap: ", marketplaceZap.address);
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
