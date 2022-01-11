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
  const rinkebyFeeDistributor = "0x29F52f4Df3Ae7bd736305c035d45EBa563CD7A2f";
  const rinkebyLPStaking = "0xcd0dfb870A60C30D957b0DF1D180a236a55b5740";
  const rinkebyStakingTokenProv = "0x262FEeCBac8Ee97200F060aeFd89BD41b961e526";
  const rinkebyInventoryStaking = "0x05aD54B40e3be8252CB257f77d9301E9CB1A9470";
  const rinkebyEligManager = "0x0256B5E9bE57D8e14BAdfF94fD79760cC44A33c2";

  const ProxyController = await ethers.getContractFactory(
    "MultiProxyController"
  );
  const proxyController = await ProxyController.deploy(
    [
      "NFTX Factory",
      "Fee Distributor",
      "LP Staking",
      "StakingTokenProvider",
      "Eligibility Manager",
      "Inventory Staking",
    ],
    [
      rinkebyVaultFactory,
      rinkebyFeeDistributor,
      rinkebyLPStaking,
      rinkebyStakingTokenProv,
      rinkebyEligManager,
      rinkebyInventoryStaking,
    ]
  );
  await proxyController.deployed();
  console.log("ProxyController:", proxyController.address);

  const rinkebyMultiProxyController = proxyController.address;

  const existingProxyController = await ethers.getContractAt(
    "ProxyController",
    "0xD6f0Dd9400E89A7062a20f8E06bf8C083b184508"
  );

  console.log("Chaging vault factory proxy admin...");
  await existingProxyController.changeProxyAdmin(
    0,
    rinkebyMultiProxyController,
    {
      gasLimit: "300000",
    }
  );
  console.log("Chaging fee distributor proxy admin...");
  await existingProxyController.changeProxyAdmin(
    4,
    rinkebyMultiProxyController,
    {
      gasLimit: "300000",
    }
  );
  console.log("Chaging LP staking proxy admin...");
  await existingProxyController.changeProxyAdmin(
    3,
    rinkebyMultiProxyController,
    {
      gasLimit: "300000",
    }
  );
  console.log("Chaging staking token provider proxy admin...");
  await existingProxyController.changeProxyAdmin(
    2,
    rinkebyMultiProxyController,
    {
      gasLimit: "300000",
    }
  );
  console.log("Chaging eligibility manager proxy admin...");
  await existingProxyController.changeProxyAdmin(
    1,
    rinkebyMultiProxyController,
    {
      gasLimit: "300000",
    }
  );
  console.log("Chaging inventory staking proxy admin...");
  await upgrades.admin.changeProxyAdmin(
    rinkebyInventoryStaking,
    rinkebyMultiProxyController
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
