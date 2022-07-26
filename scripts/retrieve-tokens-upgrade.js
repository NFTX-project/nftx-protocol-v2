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

  const VaultImpl = await ethers.getContractFactory("NFTXVaultUpgradeable");
  const vaultImpl = await VaultImpl.deploy();
  await vaultImpl.deployed();

  console.log('vault implementation deployed at:', vaultImpl.address);

  const LPStaking = await ethers.getContractFactory("NFTXLPStaking");
  const lpStaking = await LPStaking.deploy();
  await lpStaking.deployed();

  console.log('lpstaking deployed at:', lpStaking.address ,'\n');

  console.log('1) set child implementation on vault factory')
  console.log('2) set lpstaking impl on proxycontroller')
  
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
`