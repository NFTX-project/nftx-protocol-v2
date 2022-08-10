const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const uniV3FactoryAddr = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
  const uniNftManagerAddr = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const wethAddress = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";

  const nftxFactoryAddr = "0x659BA9E975b52d2b5bFDdE57B402DE674980fa36";
  const proxyControllerAddr = "0x4dAcb26bC49F76F9bc6661AE1837849a12E1e97c";

  const UniV3Staking = await ethers.getContractFactory("NFTXUniV3Staking");
  const uniStaking = await upgrades.deployProxy(
    UniV3Staking,
    [
      uniV3FactoryAddr, // uni factory
      uniNftManagerAddr, // uni nft manager
      wethAddress, // weth
      nftxFactoryAddr, // vaultFactory
    ],
    {
      initializer: "__NFTXUniV3Staking_init",
      unsafeAllow: 'delegatecall'
    }
  );
  await uniStaking.deployed();
  console.log("UniV3Staking:", uniStaking.address);

  const proxyController = await ethers.getContractAt(
    "MultiProxyController",
    proxyControllerAddr
  );

  await proxyController.addProxy("Uni Staking", uniStaking.address)
  console.log("-- add unistaking to proxycontroller");

  await upgrades.admin.changeProxyAdmin(uniStaking.address, proxyController.address);
  console.log("-- updated proxy admin on unistaking");
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
