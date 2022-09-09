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

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress = await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0xe01Cf5099e700c282A56E815ABd0C4948298Afae"
  );
  const stakingZap = await ethers.getContractAt("NFTXStakingZap", "0xd9A60945DD4b3a5Ea91480e82dA20D3AceC5D857");

  // const nft = await ethers.getContractAt("ERC721", "0x2D77756C139ed3c25472Daf233F332E8F605Dd8E");

  const Erc721 = await ethers.getContractFactory("ERC721");
  const nft = await Erc721.deploy("CryptoSloths", "CS");
  await nft.deployed();
  console.log("CryptoSloths NFT:", nft.address);

  const numMints = 10;
  for (let tokenId = 0; tokenId < numMints; tokenId++) {
    await nft.publicMint(myAddress, tokenId, { gasLimit: 100000 });
    console.log("next..");
  }
  console.log("-- minted " + numMints + " CryptoSloths");

  await vaultFactory.createVault("CryptoSloths", "SLOTH", nft.address, false, true);
  console.log("-- created vault");

  const numVaults = await vaultFactory.numVaults();
  const vaultId = numVaults.sub(1);
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
    gasLimit: "1000000",
  });
  console.log("-- liquidity staked NFTs");
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
