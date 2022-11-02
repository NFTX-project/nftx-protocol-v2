const {BigNumber} = require("@ethersproject/bignumber");
const {ethers, upgrades} = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying account:", await deployer.getAddress());
  console.log(
    "Deploying account balance:",
    (await deployer.getBalance()).toString(),
    "\n"
  );

  const YieldStakingZap = await ethers.getContractFactory("NFTXYieldStakingZap");
  // Goerli
  const zap = await YieldStakingZap.deploy(
    "0xe01Cf5099e700c282A56E815ABd0C4948298Afae",  // Vault Factory
    "0xe5AB394e284d095aDacff8A0fb486cb5a24b0b7a",  // Inventory Staking
    "0x33b381E2e0c4adC1dbd388888e9A29079e5b6702",  // LP Staking
    "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",  // SushiSwapRouter
    "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6",  // WETH
    "0xf91bb752490473b8342a3e964e855b9f9a2a668e",  // 0x Swap Target
  );
  // Mainnet
  // const zap = await YieldStakingZap.deploy(
  //    "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",  // Vault Factory
  //    "0x5fAD0e4cc9925365b9B0bbEc9e0C3536c0B1a5C7",  // Inventory Staking
  //    "0x688c3E4658B5367da06fd629E41879beaB538E37",  // LP Staking
  //    "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",  // SushiSwapRouter
  //    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  // WETH
  //    "0xdef1c0ded9bec7f1a1670819833240f027b25eff",  // 0x Swap Target
  // );
  await zap.deployed();
  console.log("Yield Staking Zap:", zap.address);
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
