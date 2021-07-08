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

  const StakingProvider = await ethers.getContractFactory(
    "StakingTokenProvider"
  );
  const provider = await upgrades.deployProxy(
    StakingProvider,
    [
      "0xc35DADB65012eC5796536bD9864eD8773aBc74C4" /*Sushiswap*/,
      "0xc778417e063141139fce010982780140aa0cd5ab" /*WETH*/,
      "x",
    ],
    {
      initializer: "__StakingTokenProvider_init",
    }
  );
  await provider.deployed();
  console.log("StakingTokenProvider:", provider.address);
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
