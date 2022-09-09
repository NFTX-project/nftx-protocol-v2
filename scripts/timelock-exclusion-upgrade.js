const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const mainnet = {
    factory: "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
    sushiRouter: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
    dao: "0x40d73df4f99bae688ce3c23a01022224fe16c7b2",
  };
  const rinkeby = {
    factory: "0xbbc53022Af15Bb973AD906577c84784c47C14371",
    sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  };
  const arbitrum = {
    factory: "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",
    sushiRouter: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  };

  const TimelockExcludeList = await ethers.getContractFactory("TimelockExcludeList");
  timelockExcludeList = await TimelockExcludeList.deploy();
  await timelockExcludeList.deployed();
  console.log("TimelockExcludeList:", timelockExcludeList.address);

  const StakingZap = await ethers.getContractFactory("NFTXStakingZap");
  const stakingZap = await StakingZap.deploy(mainnet.factory, mainnet.sushiRouter);
  await stakingZap.deployed();
  console.log("StakingZap: ", stakingZap.address);

  const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
  const inventoryStakingImpl = await InventoryStaking.deploy();
  await inventoryStakingImpl.deployed();
  console.log("InventoryStaking Impl:", inventoryStakingImpl.address, "\n");

  console.log("Setting TimelockExclusionList on StakingZap...");
  await stakingZap.setTimelockExcludeList(timelockExcludeList.address);
  console.log("Set TimelockExclusionList on StakingZap ✓\n ");

  // Mainnet only
  console.log("Transfering ownership of StakingZap to dao...");
  await stakingZap.transferOwnership(mainnet.dao);
  console.log("Transferred ownership of StakingZap to dao ✓\n");
  console.log("Transfering ownership of TimelockExcludeList to dao...");
  await timelockExcludeList.transferOwnership(mainnet.dao);
  console.log("Transferred ownership of TimelockExcludeList to dao ✓\n");

  // Remaining
  console.log("- Upgrade InventoryStaking proxy (5) on MultiProxyController to " + inventoryStakingImpl.address);
  console.log("- Set feeExclusion on factory for new StakingZap at " + stakingZap.address);
  console.log("- Set zapContract on factory to " + stakingZap.address + "\n");
  console.log("NOTE:");
  console.log(
    "zapContract setting on factory must get enacted at same time as frontend updates stakingZap address\n"
  );
  console.log("- After inventory staking proxy update is enacted then..");
  console.log("  1) set timelockExcludeList on InventoryStaking to " + timelockExcludeList.address);
  console.log("  2) set inventoryLockTimeErc20 on InventoryStaking to 604800");
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
