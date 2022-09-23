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

  const MarketZap = await ethers.getContractFactory(
    "NFTXMarketplace0xZap"
  );

  // Goerli constructor
  const zap = await MarketZap.deploy(
    "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",
    "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    "0xf91bb752490473b8342a3e964e855b9f9a2a668e"
  );

  // Mainnet constructor
  /*
  const zap = await MarketZap.deploy(
    "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff"
  );
  */

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
