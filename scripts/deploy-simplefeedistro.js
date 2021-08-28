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


  const SimpleFeeDistributor = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
  const simpleFeeDistrib = await upgrades.deployProxy(
    SimpleFeeDistributor,
    ["0x688c3E4658B5367da06fd629E41879beaB538E37", "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    {
      initializer: "__SimpleFeeDistributor__init__",
    }
  );
  await simpleFeeDistrib.deployed();

  await simpleFeeDistrib.setNFTXVaultFactory("0xBE86f647b167567525cCAAfcd6f881F1Ee558216");
  console.log("SimpleFeeDistributor:", simpleFeeDistrib.address);
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
