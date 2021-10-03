const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const treasuryAddr = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";

const daoAddress = treasuryAddr;

const founderAddress = "0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B";

// const teamAddresses = [
//   "0x701f373Df763308D96d8537822e8f9B2bAe4E847", // gaus1
//   "0x4586554a30148B8F4F3AB17E57C430eE193698Ec", // gaus2
//   "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48", // kiwi
//   "0x3FCe5449C7449983e263227c5AAEACB4A80B87C9", // quag
//   "0x4eAc46c2472b32dc7158110825A7443D35a90168", // javery
//   "0x45d28aA363fF215B4c6b6a212DC610f004272bb5", // chop
// ];

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );

  const NFTXV1Buyout = await ethers.getContractFactory("NFTXV1Buyout");
  const v1Buyout = await upgrades.deployProxy(NFTXV1Buyout, [], {
    initializer: "__NFTXV1Buyout_init",
  });
  await v1Buyout.deployed();

  console.log("NFTXV1Buyout:", v1Buyout.address);

  const ProxyController = await ethers.getContractFactory(
    "ProxyControllerSimple"
  );

  const proxyController = await ProxyController.deploy(v1Buyout.address);
  await proxyController.deployed();
  console.log("ProxyController address:", proxyController.address);

  console.log("\nUpdating proxy admin...");

  await upgrades.admin.changeProxyAdmin(
    v1Buyout.address,
    proxyController.address
  );

  console.log("Fetching implementation addresses...");

  await proxyController.fetchImplAddress({
    gasLimit: "150000",
  });

  console.log("Implementation address:", await proxyController.impl());

  console.log("Transfering ownerships...");
  await v1Buyout.transferOwnership(founderAddress);
  await proxyController.transferOwnership(founderAddress);

  console.log("");
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
