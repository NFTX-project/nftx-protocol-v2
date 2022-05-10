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
let randomRedeemFee, targetRedeemFee;

// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("Rinkeby vault tests", function () {
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

  it("Should fetch prices of SLOTH tokens", async () => {
    let cost1 = await fetchBuyCost(parseEther('0.0000001'));
    console.log('cost of 0.0000001 SLOTH = ' + formatEther(cost1) + ' WETH')
    let cost2 = await fetchBuyCost(parseEther('1.0'));
    console.log('cost of 1.0 SLOTH = ' + formatEther(cost2) + ' WETH');
    
  })

  async function fetchBuyCost(slothAmount) {
    let wethAddr = await sushiRouter.WETH();
    let path = [wethAddr, vault.address];
    let amountsIn = await sushiRouter.getAmountsIn(slothAmount, path);
    let costInWeth = amountsIn[0];
    return costInWeth;
  }

  it("Should fetch SLOTH vault redeem fees", async () => {
    randomRedeemFee = await vault.randomRedeemFee();
    targetRedeemFee = await vault.targetRedeemFee();
    
    console.log('randomRedeemFee', formatEther(randomRedeemFee));
    console.log('targetRedeemFee', formatEther(targetRedeemFee));
  })

  it("Should random redeem a Sloth NFT manually (without marketplace zap)", async () => {
    // Caclulate cost to redeem in SLOTH
    slothTokenCost = BASE.add(randomRedeemFee);
    console.log('Cost to random redeem a Sloth NFT:', formatEther(slothTokenCost) + ' SLOTH');
    // Caclulate cost to redeem in WETH
    let wethCost = await fetchBuyCost(slothTokenCost);
    console.log('Cost to buy ' + formatEther(slothTokenCost) + ' SLOTH:', formatEther(wethCost) + ' WETH');

    // Buy necessary amount of SLOTH from sushiswap (using ETH)
    let wethAddr = await sushiRouter.WETH();
    let path = [wethAddr, vault.address];
    let timestamp = 1652224275;
    let slothTokenBalanceInitial = await vault.balanceOf(myAddress);
    // Add 0.1 ETH to cost to ensure transaction goes through
    await sushiRouter.swapETHForExactTokens(slothTokenCost, path, myAddress, timestamp, {value: wethCost.add(parseEther("0.1"))});
    let newSlothTokenBalance = await vault.balanceOf(myAddress);
    console.log('initial SLOTH balance:', formatEther(slothTokenBalanceInitial));
    console.log('new SLOTH balance:', formatEther(newSlothTokenBalance));

    // Use SLOTH tokens to redeem Sloth NFT
    let slothNFTBalanceInitial = await nft.balanceOf(myAddress);
    await vault.redeem(1, []);
    let newSlothNFTBalance = await nft.balanceOf(myAddress);
    console.log('initial Sloth NFT balance:', slothNFTBalanceInitial.toString());
    console.log('new Sloth NFT balance:', newSlothNFTBalance.toString());
  })

  it("Should random redeem a Sloth NFT with marketplace zap", async () => {
    // Caclulate cost to redeem in SLOTH
    slothTokenCost = BASE.add(randomRedeemFee);
    console.log('Cost to random redeem a Sloth NFT:', formatEther(slothTokenCost) + ' SLOTH');
    // Caclulate cost to redeem in WETH
    let wethCost = await fetchBuyCost(slothTokenCost);
    console.log('Cost to buy ' + formatEther(slothTokenCost) + ' SLOTH:', formatEther(wethCost) + ' WETH');

    // Approve SLOTH token (same as vault) to get pulled by MarketplaceZap
    await vault.approve(marketplaceZap.address, parseEther('1000'));
    let wethAddr = await sushiRouter.WETH();
    let path = [wethAddr, vault.address];
    let slothNFTBalanceInitial = await nft.balanceOf(myAddress);
    // Redeem with ETH using MarketplaceZap (which buys SLOTH behind the scenes) — also add 0.1 ETH to cost to ensure tx goes through
    await marketplaceZap.buyAndRedeem(vaultId, 1, [], path, myAddress, {value: wethCost.add(parseEther("0.1"))});
    let newSlothNFTBalance = await nft.balanceOf(myAddress);
    console.log('initial Sloth NFT balance:', slothNFTBalanceInitial.toString());
    console.log('new Sloth NFT balance:', newSlothNFTBalance.toString());
  })
});
