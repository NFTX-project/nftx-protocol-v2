const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

// const treasury = "0x40d73df4f99bae688ce3c23a01022224fe16c7b2";

const devAddress = "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let sushiRouterAddr = "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";
let sushiFactoryAddr = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4";
let wethAddress = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

const daoAddress = devAddress;

async function main() {
  const [deployer] = await ethers.getSigners();

  const myAddress =  await deployer.getAddress();

  console.log("Deploying account:", myAddress);
  console.log("Deploying account balance:", (await deployer.getBalance()).toString(), "\n");

  const vaultFactory = await ethers.getContractAt(
    "NFTXVaultFactoryUpgradeable",
    "0xfaB3a8739E9ED9D5aa3a43F4A8442610746b57E5"
  );
  const stakingZap = await ethers.getContractAt(
    "NFTXStakingZap",
    "0xcA523fBAf06a157F3D96735b6fC0626323a65BAa"
  );


  const Erc721 = await ethers.getContractFactory("ERC721");
  nft = await Erc721.deploy("CryptoSloths", "CS");
  await nft.deployed();
  console.log("CryptoSloths NFT:", nft.address);

  const numMints = 10;
  for (let tokenId = 0; tokenId < numMints; tokenId++) {
    await nft.publicMint(myAddress, tokenId);
  }
  console.log("-- minted " + numMints + " CryptoSloths");

  await vaultFactory.createVault("CryptoSloths", "SLOTH", nft.address, false, true);
  console.log("-- created vault");

  const numVaults = await vaultFactory.numVaults();
  const vaultId = numVaults.sub(1);
  const vaultAddr = await vaultFactory.vault(vaultId);
  const vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
  await vault.finalizeVault();
  console.log("-- finalized vault");

  await nft.setApprovalForAll(stakingZap.address, true);
  console.log("-- approved NFTs to stakingzap");
  await stakingZap.provideInventory721(vaultId, [0, 1], { gasLimit: "1000000" });
  console.log('-- inventory staked NFTs')
  await stakingZap.addLiquidity721ETH(vaultId, [2, 3, 4, 5, 6, 7], 0, { value: parseEther("0.6"), gasLimit: "1000000" });
  console.log('-- liquidity staked NFTs')
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
