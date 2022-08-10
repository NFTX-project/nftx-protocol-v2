const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let zetsu, dao, dev;
let factory, proxyController;
let inventoryStaking, lpStaking, stakingZap, feeDistributor;
let paycVault, paycNft, paycVaultId, paycNftIds;

let wethAddress = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_GOERLI_API_KEY}`,
            blockNumber: 7376141,
          },
        },
      ],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xdea9196dcdd2173d6e369c2acc0facc83fd9346a"],
    });

    dev = await ethers.provider.getSigner("0xdea9196dcdd2173d6e369c2acc0facc83fd9346a");

    
  });

  it("Should work", async () => {
    const vaultFactory = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0x659BA9E975b52d2b5bFDdE57B402DE674980fa36"
    );
    const stakingZap = await ethers.getContractAt("NFTXStakingZap", "0x05a03F0d6Ca8bE7E8B9e587b178EFBb50E475ffC");
  
    const Erc721 = await ethers.getContractFactory("ERC721");
    const nft = await Erc721.connect(dev).deploy("CryptoSloths", "CS");
    await nft.deployed();
    console.log("CryptoSloths NFT:", nft.address);
  
    await nft.publicMints(myAddress, 0, 10, { gasLimit: 1000000 });
    console.log("-- minted 10 CryptoSloths");
  
    await vaultFactory.connect(dev).createVault("CryptoSloths", "SLOTH", nft.address, false, true);
    console.log("-- created vault");
  
    const numVaults = await vaultFactory.numVaults();
    const vaultId = numVaults.sub(1);
    const vaultAddr = await vaultFactory.vault(vaultId);
    console.log("Vault address:", vaultAddr);
    const vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
    await vault.connect(dev).finalizeVault();
    console.log("-- finalized vault");
  
    await nft.connect(dev).setApprovalForAll(stakingZap.address, true);
    console.log("-- approved NFTs to stakingzap");
    await stakingZap.connect(dev).provideInventory721(vaultId, [0, 1], { gasLimit: "1000000" });
    console.log("-- inventory staked NFTs");
    await stakingZap.connect(dev).addLiquidity721ETH(vaultId, [2, 3, 4, 5, 6, 7], 0, {
      value: parseEther("0.18"),
      gasLimit: "6000000",
    });
    console.log("-- liquidity staked NFTs");
  
    const marketplaceZap = await ethers.getContractAt("NFTXMarketplaceZap", "0x6DCdfD7e94957cBAE9023c232dE18c0F72c2aD16");
    await marketplaceZap.connect(dev).buyAndRedeem(vaultId, 1, [0], [wethAddress, vaultAddr], dev._address, {value: parseEther("0.05")});
    console.log("-- bought NFT 0 from vault 0");
    await nft.connect(dev).setApprovalForAll(marketplaceZap.address, true);
    await marketplaceZap.connect(dev).buyAndSwap721(vaultId, [0], [1], [wethAddress, vaultAddr], dev._address, {value: parseEther("0.005")});
    console.log("-- swapped NFT 0 for NFT 1 from vault 0");
    await marketplaceZap.connect(dev).mintAndSell721(vaultId, [1], parseEther("0.01"), [vaultAddr, wethAddress], dev._address);
    console.log("-- sold NFT 1 into vault 0");
  });
});
