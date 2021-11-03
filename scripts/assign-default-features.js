const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const notZeroAddr = "0x000000000000000000000000000000000000dead";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );
  
  const factory = await ethers.getContractAt("NFTXVaultFactoryUpgradeable", "0xBE86f647b167567525cCAAfcd6f881F1Ee558216")
  const vaults = await factory.allVaults(); 

  for (let i = 0; i < vaults.length; i++) {
    const vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaults[i])
    const randomRedeem = await vault.enableRandomRedeem()
    const randomSwap = await vault.enableRandomSwap(); 
    if (randomRedeem != randomSwap) {
      console.log(i, await vault.symbol(), vaults[i])
      let tx = await vault.assignDefaultFeatures();
      await tx.wait();
    }
  }
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
