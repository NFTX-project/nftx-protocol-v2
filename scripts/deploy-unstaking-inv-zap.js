const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const UnstakingInvZap = await ethers.getContractFactory("NFTXUnstakingInventoryZap");
  const unstakingInvZap = await UnstakingInvZap.deploy();
  await unstakingInvZap.deployed();
  console.log("UnstakingInventoryZap: ", unstakingInvZap.address);

  await unstakingInvZap.setVaultFactory("0xbbc53022Af15Bb973AD906577c84784c47C14371", {});
  await unstakingInvZap.setInventoryStaking("0xBdD4195E587F9895c4eB1b04B63783005B75c690");

  const nftxFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0xbbc53022Af15Bb973AD906577c84784c47C14371"
  );
  await nftxFactory.setFeeExclusion(unstakingInvZap.address, true, { gasLimit: "250000" });
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
