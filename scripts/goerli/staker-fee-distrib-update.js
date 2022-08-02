const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

let factory, proxyController;

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  factory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0xe01Cf5099e700c282A56E815ABd0C4948298Afae"
  );

  proxyController = await ethers.getContractAt(
    "MultiProxyController",
    "0xbde65406B20ADb4ba9D88908187Bc9460fF24da9"
  );

  // Upgrade fee distributor
  const FeeDistrImpl = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
  const feeDistrImpl = await FeeDistrImpl.deploy();
  await feeDistrImpl.deployed();
  console.log("\nfeeDistrImpl:", feeDistrImpl.address);

  await proxyController.upgradeProxyTo(1, feeDistrImpl.address, {gasLimit: 650000});
  console.log("feeDistr upgraded");

  // Upgrade LP staking
  const LPStakingImpl = await ethers.getContractFactory("NFTXLPStaking");
  const lpStakingImpl = await LPStakingImpl.deploy();
  await lpStakingImpl.deployed();
  console.log("\nlpStakingImpl:", lpStakingImpl.address);

  await proxyController.upgradeProxyTo(2, lpStakingImpl.address, {gasLimit: 650000});
  console.log("lpStaking upgraded");

  // Upgrade inventory staking
  const InvStakingImpl = await ethers.getContractFactory("NFTXInventoryStaking");
  const invStakingImpl = await InvStakingImpl.deploy();
  await invStakingImpl.deployed();
  console.log("\ninvStakingImpl:", invStakingImpl.address);

  await proxyController.upgradeProxyTo(5, invStakingImpl.address, {gasLimit: 650000});
  console.log("invStaking upgraded");

  // Upgrade vault template
  const VaultImpl = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const vaultImpl = await VaultImpl.deploy();
  await vaultImpl.deployed();
  console.log("\nvaultImpl:", vaultImpl.address);

  await factory.upgradeChildTo(vaultImpl.address, {gasLimit: 650000});
  console.log("vaultImpl upgraded");
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
