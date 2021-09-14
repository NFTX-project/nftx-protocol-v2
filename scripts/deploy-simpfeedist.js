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

  const lpStaking = "0x73D2ff81fceA9832FC9Ee90521ABde1150F6b52a";
  const controller = "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a";

  const Sfd = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
  const sfd = await upgrades.deployProxy(Sfd, [lpStaking, controller], {
    initializer: "__SimpleFeeDistributor__init__",
  });
  await sfd.deployed();
  console.log("SimpleFeeDistributor:", sfd.address);
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
