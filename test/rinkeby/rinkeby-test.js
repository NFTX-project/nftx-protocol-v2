const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, network } = require("hardhat");
const { utils } = ethers;
const { formatEther, parseEther } = utils;

const BASE = BigNumber.from(10).pow(18);

let myAddress;
let nft, factory, lpStaking, stakingZap, marketplaceZap, sushiRouter;
let vaultId, vault;

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Rinkeby unstaking test ERC721", function () {
  before("Setup", async () => {
    let signers = await ethers.getSigners();
    let signer = signers[0];
    myAddress = signer.address;

    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_RINKEBY_API_KEY}`,
            blockNumber: 10597099,
          },
        },
      ],
    });

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"],
    });
    nftxDevAccount = await ethers.provider.getSigner("0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a");

    await nftxDevAccount.sendTransaction({
      to: myAddress,
      value: parseEther("10"),
    });

    factory = await ethers.getContractAt("NFTXVaultFactoryUpgradeable", "0xbbc53022Af15Bb973AD906577c84784c47C14371");
    lpStaking = await ethers.getContractAt("NFTXLPStaking", "0xcd0dfb870A60C30D957b0DF1D180a236a55b5740");
    stakingZap = await ethers.getContractAt("NFTXStakingZap", "0xeF5F5491EF04Df94638162Cb8f7CBAd64760e797");
    marketplaceZap = await ethers.getContractAt("NFTXMarketplaceZap", "0xF83d27657a6474cB2Ae09a5b39177BBB80E63d81");
    sushiRouter = await ethers.getContractAt("IUniswapV2Router01", "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506");
  });

  it("Should deploy and mint NFT", async () => {
    const Erc721 = await ethers.getContractFactory("ERC721");
    console.log("\nDeploying CryptoSloths NFT");
    nft = await Erc721.deploy("CryptoSloths", "CS");
    await nft.deployed();

    console.log("Minting 8 CryptoSloths (#0 to #7)");
    for (let tokenId = 0; tokenId < 8; tokenId++) {
      await nft.publicMint(myAddress, tokenId);
    }
  });

  it("Should create and finalize vault", async () => {
    console.log("\nCreating SLOTH vault");
    await factory.createVault("CryptoSloths", "SLOTH", nft.address, false, true);
    let numVaults = await factory.numVaults();
    vaultId = numVaults.sub(1);
    let vaultAddr = await factory.vault(vaultId);
    vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
    await vault.finalizeVault();
  });

  it("Should inventory stake", async () => {
    console.log("\nUsing 2 CryptoSloths to inventory stake");
    await nft.approve(stakingZap.address, 0);
    await nft.approve(stakingZap.address, 1);
    await stakingZap.provideInventory721(vaultId, [0, 1]);
  });

  it("Should liquidity stake", async () => {
    console.log("\nUsing 6 CryptoSloths and 6 ETH to liquidity stake");
    for (let tokenId = 2; tokenId < 8; tokenId++) {
      await nft.approve(stakingZap.address, tokenId);
    }
    await stakingZap.addLiquidity721ETH(vaultId, [2, 3, 4, 5, 6, 7], 0, { value: parseEther("3") });
  });

  it("Should fetch SLP address", async () => {
    console.log("\nFetching SLP address of SLOTHWETH");
    let stakingInfo = await lpStaking.vaultStakingInfo(vaultId);
    let slpAddr = stakingInfo[0];
    slp = await ethers.getContractAt("IUniswapV2Pair", slpAddr);
  });

  async function fetchBuyCost(slothAmount) {
    let token0Addr = await slp.token0();
    let isSlothFirstToken = vault.address == token0Addr;
    let slothReserves, wethReserves;

    if (isSlothFirstToken) {
      [slothReserves, wethReserves] = await slp.getReserves();
    } else {
      [wethReserves, slothReserves] = await slp.getReserves();
    }
    console.log("slothReserves:", formatEther(slothReserves));
    console.log("wethReserves:", formatEther(wethReserves));
    let cost = await sushiRouter.quote(slothAmount, slothReserves, wethReserves);
    return cost;
  }

  it("Should retrieve cost of SLOTH buys", async () => {
    console.log("\nCalculating cost of SLOTH buys (in WETH)");

    let smallBuyCost = await fetchBuyCost(parseEther("0.0000001"));
    console.log("smallBuyCost:", formatEther(smallBuyCost.toString()));

    let fullTokenPrice = await fetchBuyCost(parseEther("1"));
    console.log("fullTokenPrice:", formatEther(fullTokenPrice.toString()));
  });
});
