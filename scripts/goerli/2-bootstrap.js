const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

// const treasury = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";

const devAddress = "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let sushiRouterAddr = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
let sushiFactoryAddr = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
let wethAddress = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";

const daoAddress = devAddress;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0x659BA9E975b52d2b5bFDdE57B402DE674980fa36"
  );
  const stakingZap = await ethers.getContractAt("NFTXStakingZap", "0x05a03F0d6Ca8bE7E8B9e587b178EFBb50E475ffC");

  const Erc721 = await ethers.getContractFactory("ERC721");
  const nft = await Erc721.deploy("CryptoSloths", "CS");
  await nft.deployed();
  console.log("CryptoSloths NFT:", nft.address);

  await nft.publicMints(myAddress, 0, 10, { gasLimit: 1000000 });
  console.log("-- minted 10 CryptoSloths");

  await vaultFactory.createVault("CryptoSloths", "SLOTH", nft.address, false, true);
  console.log("-- created vault");
  await sleep(3000);

  // const nft = await ethers.getContractAt("ERC721", "0x8AD238377531547838370B9C4aC346b9Ed5466Ea");

  const numVaults = await vaultFactory.numVaults();
  console.log('numVaults:', numVaults)
  const vaultId = numVaults.sub(1);
  console.log('vaultId:', vaultId);
  const vaultAddr = await vaultFactory.vault(vaultId);
  console.log("Vault address:", vaultAddr);
  const vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
  await vault.finalizeVault();
  console.log("-- finalized vault");

  await nft.setApprovalForAll(stakingZap.address, true);
  console.log("-- approved NFTs to stakingzap");
  await stakingZap.provideInventory721(vaultId, [0, 1], { gasLimit: "1000000" });
  console.log("-- inventory staked NFTs");
  await stakingZap.addLiquidity721ETH(vaultId, [2, 3, 4, 5, 6, 7], 0, {
    value: parseEther("0.18"),
    gasLimit: "6000000",
  });
  console.log("-- liquidity staked NFTs");

  // const vaultAddr = "0x559C361a5138D27359Aa21c7cBa317D814163010";
  // vaultId = 0;

  const marketplaceZap = await ethers.getContractAt("NFTXMarketplaceZap", "0x6DCdfD7e94957cBAE9023c232dE18c0F72c2aD16");
  await marketplaceZap.buyAndRedeem(vaultId, 1, [0], [wethAddress, vaultAddr], myAddress, {value: parseEther("0.05"), gasLimit: "1000000"});
  console.log("-- bought NFT 0 from vault 0");
  await nft.setApprovalForAll(marketplaceZap.address, true);
  await marketplaceZap.buyAndSwap721(vaultId, [0], [1], [wethAddress, vaultAddr], myAddress, {value: parseEther("0.005"), gasLimit: "1000000"});
  console.log("-- swapped NFT 0 for NFT 1 from vault 0");
  await marketplaceZap.mintAndSell721(vaultId, [1], parseEther("0.01"), [vaultAddr, wethAddress], myAddress, {gasLimit: "1000000"});
  console.log("-- sold NFT 1 into vault 0");
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
