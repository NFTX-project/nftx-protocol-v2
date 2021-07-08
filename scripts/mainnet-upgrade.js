const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const treasuryAddr = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";

const daoAddress = treasuryAddr;

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
      "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac" /*Sushiswap*/,
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" /*WETH*/,
      "x",
    ],
    {
      initializer: "__StakingTokenProvider_init",
    }
  );
  await provider.deployed();
  console.log("StakingTokenProvider:", provider.address);

  const ProxyController = await ethers.getContractFactory("ProxyController");
  const proxyController = await ProxyController.deploy(
    "0xBE86f647b167567525cCAAfcd6f881F1Ee558216", // factory
    "0x4086e98Cce041d286112d021612fD894cFed94D5", // eligmanager
    provider.address,
    "0x688c3E4658B5367da06fd629E41879beaB538E37", // staking
    "0x7AE9D7Ee8489cAD7aFc84111b8b185EE594Ae090" //  feedistributor
  );
  await proxyController.deployed();
  console.log("ProxyController address:", proxyController.address);

  console.log("\nUpdating proxy admin...");
  await upgrades.admin.changeProxyAdmin(
    provider.address,
    proxyController.address
  );

  console.log("Fetching implementation address...");
  await proxyController.fetchImplAddress(2, {
    gasLimit: "150000",
  });

  console.log("Transfering ownership...");
  await provider.transferOwnership(daoAddress);
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
