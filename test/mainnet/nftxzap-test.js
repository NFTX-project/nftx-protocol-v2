const { expect } = require("chai");
const { expectRevert } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");


const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, kiwi;
let dao;

let nftx;
let zap;
let staking;
let erc721;
let feeDistrib;
let provider;
const vaults = [];

describe("LP Zap Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 12839990,
          },
        },
      ],
    });

    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];
    console.log(primary.address);

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });

    kiwi = await ethers.provider.getSigner(
      "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );

    vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x114f1388fab456c4ba31b1850b244eedcd024136"
    );
    vaults.push(vault);

    nftx = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    erc721 = await ethers.getContractAt(
      "CryptoPunksMarket",
      "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB"
    );
    staking = await ethers.getContractAt(
      "NFTXLPStaking",
      "0x688c3E4658B5367da06fd629E41879beaB538E37"
    );
    feeDistrib = await ethers.getContractAt(
      "NFTXFeeDistributor",
      "0x7AE9D7Ee8489cAD7aFc84111b8b185EE594Ae090"
    );

    let Zap = await ethers.getContractFactory("NFTXStakingZap");
    console.log("deploying");

    zap = await Zap.deploy(
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F" /* Sushi Router */
    );
    console.log("deployed");
    await zap.deployed();

    await nftx.connect(dao).setZapContract(zap.address);
  });

  it("Should enable fee distribution", async () => {
    await feeDistrib.connect(dao).pauseFeeDistribution(false);
  });

  it("Should exclude the zap from fees", async () => {
    await nftx.connect(dao).setFeeExclusion(zap.address, true);
  })
  
  it("Should deploy and upgrade the vault implementation", async () => {
    const NewVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    const newVault = await NewVault.deploy();
    await newVault.deployed();
    
    await nftx.connect(dao).upgradeChildTo(newVault.address);
    expect(await nftx.childImplementation()).to.equal(newVault.address);
  });

  it("Should set state fields", async () => {
    expect(await zap.nftxFactory()).to.equal(nftx.address);
    expect(await zap.lpStaking()).to.equal(staking.address);
    expect(await zap.sushiRouter()).to.equal(
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    );
  });

  it("Should mint some 721", async () => {
    const assetAddress = await vaults[0].assetAddress();
    const coolCats = await ethers.getContractAt("ERC721", assetAddress);
    await coolCats.connect(kiwi).setApprovalForAll(zap.address, true);
    await vaults[0].connect(kiwi).approve(zap.address, BASE.mul(1000))
    await vaults[0].connect(kiwi).mint([9852], [])
  });

  it("Should fail to add liquidity if min > in", async () => {
    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x0225e940deecc32a8d7c003cfb7dae22af18460c")
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountToLP = BASE.mul(5); //.sub(mintFee.mul(5)) no fee anymore
    const amountETH = await router.quote(amountToLP, reserve0, reserve1)
    await expectRevert(zap.connect(kiwi).addLiquidity721ETH(31, [1199,6179,8859,1861,6416], amountETH.add(500), {value: amountETH}), "INSUFFICIENT")
  })

  let lpTokenAmount;
  it("Should add liquidity with 721 on existing pool", async () => {
    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x0225e940deecc32a8d7c003cfb7dae22af18460c")
    const preDepositBal = await pair.balanceOf(staking.address);
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountToLP = BASE.mul(5); //.sub(mintFee.mul(5)) no fee anymore
    const amountETH = await router.quote(amountToLP, reserve0, reserve1)
    await zap.connect(kiwi).addLiquidity721ETH(31, [184,5916,2581,8862,6179], amountETH.sub(500), {value: amountETH})
    const postDepositBal = await pair.balanceOf(staking.address);
    lpTokenAmount = postDepositBal.sub(preDepositBal)
  })

  it("Should add liquidity with 721 using weth", async () => {
    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x0225e940deecc32a8d7c003cfb7dae22af18460c")
    const WETH = await zap.WETH();
    const weth = await ethers.getContractAt("IWETH", WETH);
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountToLP = BASE.mul(1);
    const amountETH = await router.quote(amountToLP, reserve0, reserve1)
    await weth.connect(kiwi).deposit({value: amountETH});

    const weth20 = await ethers.getContractAt("IERC20Upgradeable", WETH);
    await weth20.connect(kiwi).approve(zap.address, BASE.mul(500))
    const preDepositBal = await pair.balanceOf(staking.address);
    await zap.connect(kiwi).addLiquidity721(31, [2271], amountETH.sub(500), amountETH)
    const postDepositBal = await pair.balanceOf(staking.address);
    lpTokenAmount = lpTokenAmount.add(postDepositBal.sub(preDepositBal))
  });

  it("Should have locked balance", async () => {
    const locked = await zap.lockedUntil(31, kiwi.getAddress());
    expect(await zap.lockedLPBalance(31, kiwi.getAddress())).to.equal(
      lpTokenAmount.toString()
    );
    expect(locked).to.be.gt(1625729248);
  });

  it("Should pass some time", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60]);
    await ethers.provider.send("evm_mine", []);
  })

  let noPool1155NFT;
  let nft1155Id;
  it("Should create a vault for an ERC1155 token", async () => {
    let ERC1155 = await ethers.getContractFactory("ERC1155");
    noPool1155NFT = await ERC1155.deploy("");
    await noPool1155NFT.deployed();
    const response = await nftx.createVault("FAKE", "FAKE", noPool1155NFT.address, true, true);
    const receipt = await response.wait(0);
    nft1155Id = receipt.events
      .find((elem) => elem.event === "NewVault")
      .args[0].toString();
    const vaultAddr = await nftx.vault(nft1155Id);
    await noPool1155NFT.connect(kiwi).publicMintBatch(kiwi.getAddress(), [0, 1, 2, 3], [10, 10, 10, 5]);
    let new1155Vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
    vaults.push(new1155Vault)
  });

  it("Should add mint some for 1155", async () => {
    await noPool1155NFT.connect(kiwi).setApprovalForAll(zap.address, true);
    await vaults[1].connect(kiwi).approve(zap.address, BASE.mul(1000))
    await noPool1155NFT.connect(kiwi).setApprovalForAll(vaults[1].address, true);
    await vaults[1].connect(kiwi).mint([3], [4])
  });

  it("Should add liquidity with 1155 using weth with no pool", async () => {
    const amountETH = ethers.utils.parseEther("1.0");
    const WETH = await zap.WETH();
    const weth = await ethers.getContractAt("IWETH", WETH);
    await weth.connect(kiwi).deposit({value: amountETH});

    const weth20 = await ethers.getContractAt("IERC20Upgradeable", WETH);
    await weth20.connect(kiwi).approve(zap.address, BASE.mul(500))
    await zap.connect(kiwi).addLiquidity1155(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, amountETH)
  });

  it("Should add liquidity with 1155 an eth", async () => {
    const amountETH = ethers.utils.parseEther("1.0");
    await zap.connect(kiwi).addLiquidity1155ETH(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, {value: amountETH})
  });

  it("Should not allow to withdraw locked tokens before lock", async () => {
    await expectRevert(zap.connect(kiwi).withdrawXLPTokens(nft1155Id), ": Locked");
  });

  it("Should not allow to withdraw other locked tokens before lock", async () => {
    await expectRevert(zap.connect(kiwi).withdrawXLPTokens(31), ": Locked");
  });


  it("Should mint to generate some rewards", async () => {
    await vaults[1].connect(kiwi).mint([3], [1])
    await vaults[0].connect(kiwi).mint([4668], [])
  })
  
  it("Should allow withdrawing locked tokens after time passes", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60 + 20]);
    await ethers.provider.send("evm_mine", []);
    await zap.connect(kiwi).withdrawXLPTokens(31)
  })

  it("Should allow withdrawing other locked tokens after time passes", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60 + 20]);
    await ethers.provider.send("evm_mine", []);
    await zap.connect(kiwi).withdrawXLPTokens(nft1155Id)
  })

  it("Should allow claiming rewards after unlocking", async () => {
    await staking.connect(kiwi).claimRewards(31);
    await staking.connect(kiwi).claimRewards(nft1155Id);
  })
});
