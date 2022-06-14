const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

// const treasury = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";

const devAddress = "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let sushiRouterAddr = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
let sushiFactoryAddr = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
let wethAddress = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";

const daoAddress = devAddress;

// const teamAddresses = [
//   "0x4586554a30148B8F4F3AB17E57C430eE193698Ec", // gaus
//   "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48", // kiwi
//   "0x3FCe5449C7449983e263227c5AAEACB4A80B87C9", // quag
//   "0x4eAc46c2472b32dc7158110825A7443D35a90168", // javery
//   "0x45d28aA363fF215B4c6b6a212DC610f004272bb5", // chop
//   "0x84f4840E47199F1090cEB108f74C5F332219539A", // caps
//   "0xfe1aa5275dda4b333b1fb0ccbd7a5f14edc4a5de"  // jb
// ];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  // const provider = await ethers.getContractAt(
  //   "StakingTokenProvider",
  //   "0xe5AB394e284d095aDacff8A0fb486cb5a24b0b7a"
  // );
  // const lpStaking = await ethers.getContractAt(
  //   "NFTXLPStaking",
  //   "0x33b381E2e0c4adC1dbd388888e9A29079e5b6702"
  // );
  // const vaultTemplate = await ethers.getContractAt(
  //   "NFTXVaultUpgradeable",
  //   "0xB14B8F97ba435c72C9814e05F946a00593559D2E"
  // );
  // const feeDistrib = await ethers.getContractAt(
  //   "NFTXSimpleFeeDistributor",
  //   "0x4939F5e390d20b7aC0Bd6913A353dfF753DD2765"
  // );
  // const vaultFactory = await ethers.getContractAt(
  //   "NFTXVaultFactoryUpgradeable",
  //   "0xe01Cf5099e700c282A56E815ABd0C4948298Afae"
  // );
  // const eligManager = await ethers.getContractAt(
  //   "NFTXEligibilityManager",
  //   "0x0B8Ee2Ee7d6f3bFB73C9aE2127558D1172B65fb1"
  // );
  // const inventoryStaking = await ethers.getContractAt(
  //   "NFTXInventoryStaking",
  //   "0xDde5A3175F5C9755480E4CB3cCA5F1865C1976D6"
  // );
  // const stakingZap = await ethers.getContractAt(
  //   "NFTXStakingZap",
  //   "0xd9A60945DD4b3a5Ea91480e82dA20D3AceC5D857"
  // );
  // const timelockExcludeList = await ethers.getContractAt(
  //   "TimelockExcludeList",
  //   "0xFf40913CA69912212e00e93Ad4DD1480A7aeF13A"
  // );
  // const proxyController = await ethers.getContractAt(
  //   "MultiProxyController",
  //   "0xbde65406B20ADb4ba9D88908187Bc9460fF24da9"
  // );
  // const unstakingZap = await ethers.getContractAt(
  //   "NFTXUnstakingInventoryZap",
  //   "0x7c656F0691Db983ee78f68189c55C36d1862c901"
  // );

  const StakingProvider = await ethers.getContractFactory("StakingTokenProvider");
  const provider = await upgrades.deployProxy(StakingProvider, [sushiFactoryAddr, wethAddress, "x"], {
    initializer: "__StakingTokenProvider_init",
  });
  await provider.deployed();
  console.log("StakingTokenProvider:", provider.address);

  const LPStaking = await ethers.getContractFactory("NFTXLPStaking");
  const lpStaking = await upgrades.deployProxy(LPStaking, [provider.address], {
    initializer: "__NFTXLPStaking__init",
    unsafeAllow: "delegatecall",
  });
  await lpStaking.deployed();
  console.log("LPStaking:", lpStaking.address);

  const VaultTemplate = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const vaultTemplate = await VaultTemplate.deploy();
  await vaultTemplate.deployed();
  console.log("Vault template:", vaultTemplate.address);

  const FeeDistributor = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
  const feeDistrib = await upgrades.deployProxy(FeeDistributor, [lpStaking.address, notZeroAddr], {
    initializer: "__SimpleFeeDistributor__init__",
    unsafeAllow: "delegatecall",
  });
  await feeDistrib.deployed();
  console.log("FeeDistributor:", feeDistrib.address);

  const VaultFactory = await ethers.getContractFactory("NFTXVaultFactoryUpgradeable");
  const vaultFactory = await upgrades.deployProxy(VaultFactory, [vaultTemplate.address, feeDistrib.address], {
    initializer: "__NFTXVaultFactory_init",
    unsafeAllow: "delegatecall",
  });
  await vaultFactory.deployed();
  console.log("VaultFactory:", vaultFactory.address);

  await feeDistrib.setNFTXVaultFactory(vaultFactory.address);
  console.log("-- set vaultfactory on feedistrib");
  await lpStaking.setNFTXVaultFactory(vaultFactory.address);
  console.log("-- set vaultfactory on lpstaking");

  const Elig = await ethers.getContractFactory("NFTXEligibilityManager");
  const eligManager = await upgrades.deployProxy(Elig, [], {
    initializer: "__NFTXEligibilityManager_init",
  });
  await eligManager.deployed();
  console.log("EligibilityManager:", eligManager.address);

  await vaultFactory.setEligibilityManager(eligManager.address);
  console.log("-- set eligibilitymanager");

  const ListElig = await ethers.getContractFactory("NFTXListEligibility");
  const listElig = await ListElig.deploy();
  await listElig.deployed();
  console.log("-- list eligbility deployed");
  await eligManager.addModule(listElig.address);
  console.log("-- list eligibilty added");

  const RangeElig = await ethers.getContractFactory("NFTXRangeEligibility");
  const rangeElig = await RangeElig.deploy();
  await rangeElig.deployed();
  console.log("-- range eligbility deployed");
  await eligManager.addModule(rangeElig.address);
  console.log("-- range eligibilty added");

  const InventoryStaking = await ethers.getContractFactory("NFTXInventoryStaking");
  const inventoryStaking = await upgrades.deployProxy(InventoryStaking, [vaultFactory.address], {
    initializer: "__NFTXInventoryStaking_init",
    unsafeAllow: "delegatecall",
  });
  await inventoryStaking.deployed();
  console.log("InventoryStaking:", inventoryStaking.address);

  await feeDistrib.setInventoryStakingAddress(inventoryStaking.address);
  console.log("-- updated inventory staking address");

  await feeDistrib.addReceiver("200000000000000000", inventoryStaking.address, true);
  console.log("-- added fee receiver 1 address");

  /* feeDistrib.addReceiver("800000000000000000", <lpStaking>, true) is part of setup */

  const StakingZap = await ethers.getContractFactory("NFTXStakingZap");
  const stakingZap = await StakingZap.deploy(vaultFactory.address, sushiRouterAddr);
  await stakingZap.deployed();
  console.log("StakingZap: ", stakingZap.address);

  await stakingZap.setLPLockTime(600);
  console.log("-- set lp lock time");

  await stakingZap.setInventoryLockTime(800);
  console.log("-- set inventory lock time");

  await inventoryStaking.setInventoryLockTimeErc20(800);
  console.log("-- set inventory lock time erc20");

  await stakingZap.assignStakingContracts();
  console.log("-- assigned staking contracts");

  await vaultFactory.setFeeExclusion(stakingZap.address, true);
  console.log("-- set fee exclusion");

  await vaultFactory.setZapContract(stakingZap.address);
  console.log("-- set zap contract");

  const MarketplaceZap = await ethers.getContractFactory("NFTXMarketplaceZap");
  const marketplaceZap = await MarketplaceZap.deploy(vaultFactory.address, sushiRouterAddr);
  await marketplaceZap.deployed();
  console.log("MarketplaceZap: ", marketplaceZap.address);

  const TimelockExcludeList = await ethers.getContractFactory("TimelockExcludeList");
  const timelockExcludeList = await TimelockExcludeList.deploy();
  await timelockExcludeList.deployed();
  console.log("TimelockExcludeList:", timelockExcludeList.address);

  await stakingZap.setTimelockExcludeList(timelockExcludeList.address);
  console.log("-- set timelockexcludelist on stakingzap");
  await inventoryStaking.setTimelockExcludeList(timelockExcludeList.address);
  console.log("-- set timelockexcludelist on inventorystaking");

  const ProxyController = await ethers.getContractFactory("MultiProxyController");
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
      vaultFactory.address,
      feeDistrib.address,
      lpStaking.address,
      provider.address,
      eligManager.address,
      inventoryStaking.address,
    ]
  );
  await proxyController.deployed();
  console.log("ProxyController:", proxyController.address);

  await upgrades.admin.changeProxyAdmin(vaultFactory.address, proxyController.address);
  console.log("-- updated proxy admin on vaultfactory");
  await upgrades.admin.changeProxyAdmin(feeDistrib.address, proxyController.address);
  console.log("-- updated proxy admin on feedistrib");
  await upgrades.admin.changeProxyAdmin(lpStaking.address, proxyController.address);
  console.log("-- updated proxy admin on lpstaking");
  await upgrades.admin.changeProxyAdmin(provider.address, proxyController.address);
  console.log("-- updated proxy admin on provider");
  await upgrades.admin.changeProxyAdmin(eligManager.address, proxyController.address);
  console.log("-- updated proxy admin on eligmanager");
  await upgrades.admin.changeProxyAdmin(inventoryStaking.address, proxyController.address);
  console.log("-- updated proxy admin on inventorystaking");

  const UnstakingZap = await ethers.getContractFactory("NFTXUnstakingInventoryZap");
  const unstakingZap = await UnstakingZap.deploy();
  await unstakingZap.deployed();

  console.log("UnstakingInventoryZap:", unstakingZap.address);

  await unstakingZap.setVaultFactory(vaultFactory.address);
  console.log("-- set vault factory on unstakingzap");
  await unstakingZap.setInventoryStaking(inventoryStaking.address);
  console.log("-- set inventory staking on unstakingzap");

  // console.log("Adding guardians...");
  // for (let i = 0; i < teamAddresses.length; i++) {
  //   let teamAddr = teamAddresses[i];
  //   await nftx.setIsGuardian(teamAddr, true);
  // }

  // console.log("Transfering ownerships...");
  // await provider.transferOwnership(daoAddress);
  // await staking.transferOwnership(daoAddress);
  // await feeDistrib.transferOwnership(daoAddress);
  // await nftx.transferOwnership(daoAddress);
  // await eligManager.transferOwnership(daoAddress);
  // await proxyController.transferOwnership(daoAddress);
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
