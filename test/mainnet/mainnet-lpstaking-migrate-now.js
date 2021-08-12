const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const addresses = require("../../addresses/rinkeby.json");
const { zeroPad } = require("ethers/lib/utils");

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, kiwi;
let dao;
let founder;

let nftx;
let zap;
let staking;
let erc721;
let feeDistrib;
let controller;
let liveBugUser;
const vaults = [];

describe("LP Staking Upgrade Migrate Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 12964000,
          },
        },
      ],
    });

    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8B0C8c18993a31F57e60d81761F532Ef14633153"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"],
    });
    
    kiwi = await ethers.provider.getSigner(
      "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );
    liveBugUser = await ethers.provider.getSigner(
      "0x8B0C8c18993a31F57e60d81761F532Ef14633153"
    );
    founder = await ethers.provider.getSigner(
      "0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"
    );

    nftx = await ethers.getContractAt(
      "NFTXVaultFactoryUpgradeable",
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216"
    );
    staking = await ethers.getContractAt(
      "NFTXLPStaking",
      "0x688c3E4658B5367da06fd629E41879beaB538E37"
    );
    controller = await ethers.getContractAt(
      "ProxyController",
      "0x4333d66Ec59762D1626Ec102d7700E64610437Df"
    );

    let Zap = await ethers.getContractFactory("NFTXStakingZap");

    zap = await Zap.deploy(
      "0xBE86f647b167567525cCAAfcd6f881F1Ee558216",
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F" /* Sushi Router */
    );
    await zap.deployed();

    await nftx.connect(dao).setZapContract(zap.address);
  });

  it("Should exclude the zap from fees", async () => {
    await nftx.connect(dao).setFeeExclusion(zap.address, true);
  })

  it("Should set state fields", async () => {
    expect(await zap.nftxFactory()).to.equal(nftx.address);
    expect(await zap.lpStaking()).to.equal(staking.address);
    expect(await zap.sushiRouter()).to.equal(
      "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    );
  });

  it("Should upgrade the LP staking", async () => {
    let NewStaking = await ethers.getContractFactory("NFTXLPStaking");
    let newStaking = await NewStaking.deploy();
    await newStaking.deployed();
    await controller.connect(dao).upgradeProxyTo(3, newStaking.address);
    await staking.assignNewImpl();
  });

  it("Should let v2 staker to migrate with claiming", async () => {
    let oldDisttoken = await staking.oldRewardDistributionToken(31);
    let address = await nftx.vault(31);
    let vaultToken = await ethers.getContractAt("IERC20Upgradeable", address)
    let oldBal = await vaultToken.balanceOf(kiwi.getAddress());
    let oldDistBal = await vaultToken.balanceOf(oldDisttoken);
    await staking.connect(kiwi).emergencyMigrate(31);
    let newBal = await vaultToken.balanceOf(kiwi.getAddress());
    let newDistBal = await vaultToken.balanceOf(oldDisttoken);
    expect(newBal).to.not.equal(oldBal);
    expect(newDistBal).to.not.equal(oldDistBal);
  })


  it("Should add liquidity with 721 on existing pool", async () => {
    vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x114f1388fab456c4ba31b1850b244eedcd024136"
    );
    vaults.push(vault);
    const assetAddress = await vaults[0].assetAddress();
    const coolCats = await ethers.getContractAt("ERC721", assetAddress);
    await coolCats.connect(kiwi).setApprovalForAll(zap.address, true);

    const router = await ethers.getContractAt("IUniswapV2Router01", "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F");
    const pair = await ethers.getContractAt("IUniswapV2Pair", "0x0225e940deecc32a8d7c003cfb7dae22af18460c")
    const {
      reserve0,
      reserve1,
    } = await pair.getReserves();
    const amountToLP = BASE.mul(2); //.sub(mintFee.mul(5)) no fee anymore
    const amountETH = await router.quote(amountToLP, reserve0, reserve1)
    await vaults[0].connect(kiwi).approve(zap.address, BASE.mul(1000))
    await zap.connect(kiwi).addLiquidity721ETH(31, [9852,9838], amountETH.sub(500), {value: amountETH})
    const postDepositBal = await pair.balanceOf(staking.address);
  });

  it("Should have locked balance", async () => {
    let newDisttoken = await staking.newRewardDistributionToken(31);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    const locked = await zap.lockedUntil(31, kiwi.getAddress());
    expect(await zap.lockedLPBalance(31, kiwi.getAddress())).to.equal(
      await distToken.balanceOf(kiwi.getAddress())
    );
    expect(locked).to.be.gt(1625729248);
  });

  it("Should mint to generate some rewards", async () => {
    let newDisttoken = await staking.newRewardDistributionToken(31);
    let oldBal = await vaults[0].balanceOf(newDisttoken);
    await vaults[0].connect(kiwi).mint([2581], [1]);
    let newBal = await vaults[0].balanceOf(newDisttoken);
    expect(oldBal).to.not.equal(newBal);
  })

  it("Should not allow to withdraw locked tokens before lock", async () => {
    await expectException(staking.connect(kiwi).exit(31), "User locked");
  });

  it("Should allow claiming rewards before unlocking", async () => {
    let oldBal = await vaults[0].balanceOf(kiwi.getAddress());
    await staking.connect(kiwi).claimRewards(31);
    let newBal = await vaults[0].balanceOf(kiwi.getAddress());
    expect(newBal).to.not.equal(oldBal);
  })
  
  it("Should pass some time", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60]);
    await ethers.provider.send("evm_mine", []);
  });


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

  it("Should add liquidity with 1155 using weth with no pool for someone else", async () => {
    const amountETH = ethers.utils.parseEther("1.0");
    const WETH = await zap.WETH();
    const weth = await ethers.getContractAt("IWETH", WETH);
    await weth.connect(kiwi).deposit({value: amountETH});

    const weth20 = await ethers.getContractAt("IERC20Upgradeable", WETH);
    await weth20.connect(kiwi).approve(zap.address, BASE.mul(500))
    await zap.connect(kiwi).addLiquidity1155To(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, amountETH, primary.getAddress())
  });

  it("Should add liquidity with 1155 an eth", async () => {
    const amountETH = ethers.utils.parseEther("1.0");
    await zap.connect(kiwi).addLiquidity1155ETH(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, {value: amountETH})
  });

  it("Should not allow to withdraw locked tokens for someone else before lock", async () => {
    await expectException(staking.connect(primary).exit(nft1155Id), "User locked");
  });
  it("Should not allow to withdraw locked tokens before lock", async () => {
    await expectException(staking.connect(kiwi).exit(nft1155Id), "User locked");
  });

  it("Should not allow to withdraw locked tokens before lock", async () => {
    await expectException(staking.connect(kiwi).exit(31), "User locked");
  });

  it("Should not allow transfer before lock", async () => {
    let newDisttoken = await staking.newRewardDistributionToken(31);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    await expectException(distToken.connect(kiwi).transfer(dao.getAddress(), 1), "User locked");
  });

  it("Should pass some time", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60]);
    await ethers.provider.send("evm_mine", []);
  });

  it("Should distribute current new rewards to new LP token", async () => {
    let newDisttoken = await staking.newRewardDistributionToken(31);
    let oldBal = await vaults[0].balanceOf(newDisttoken);
    await vaults[0].connect(kiwi).mint([9059], [1]);
    let newBal = await vaults[0].balanceOf(newDisttoken);
    expect(oldBal).to.not.equal(newBal);
  });

  it("Should allow to exit and claim locked tokens after lock", async () => {
    let oldBal = await vaults[0].balanceOf(kiwi.getAddress());
    await staking.connect(kiwi).claimMultipleRewards([31, nft1155Id]);
    let newBal = await vaults[0].balanceOf(kiwi.getAddress());
    expect(newBal).to.not.equal(oldBal);
    expect(await zap.lockedLPBalance(31, kiwi.getAddress())).to.equal(0);
  });

  it("Should pass some time", async () => {
    await ethers.provider.send("evm_increaseTime",  [24*60*60]);
    await ethers.provider.send("evm_mine", []);
  });

  it("Should allow to withdraw locked tokens for someone else after lock", async () => {
    await staking.connect(primary).exit(nft1155Id);
  });

  it("Should allow to withdraw locked 1155 tokens after lock", async () => {
    await staking.connect(kiwi).exit(nft1155Id);
  });

  it("Should not allow someone who isnt founder to admin mint xSLP", async () => {
    await staking.updatePoolForVault(101);
    let newDisttoken = await staking.newRewardDistributionToken(101);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    let oldBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    await expectException(staking.connect(kiwi).adminMint(101, "0x9307547d686b2909b4c4eb932777a2d5615dece0", ethers.utils.parseEther("2.666125390411983827")), "Not authed");
    let newBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    expect(oldBal).to.equal(newBal);
  });
  
  it("Should allow to foudner to admin mint xSLP", async () => {
    await staking.updatePoolForVault(101);
    let newDisttoken = await staking.newRewardDistributionToken(101);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    let oldBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    await staking.connect(founder).adminMint(101, "0x9307547d686b2909b4c4eb932777a2d5615dece0", ethers.utils.parseEther("2.666125390411983827"));
    let newBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    expect(newBal).to.equal(oldBal.add(ethers.utils.parseEther("2.666125390411983827")));
  });

  it("Should not allow someone who isnt founder to admin butn xSLP", async () => {
    await staking.updatePoolForVault(101);
    let newDisttoken = await staking.newRewardDistributionToken(101);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    let oldBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    await expectException(staking.connect(kiwi).adminBurn(101, "0x9307547d686b2909b4c4eb932777a2d5615dece0", ethers.utils.parseEther("2.666125390411983827")), "Not authed");
    let newBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    expect(oldBal).to.equal(newBal);
  });
  
  it("Should allow to founder to admin burn xSLP", async () => {
    await staking.updatePoolForVault(101);
    let newDisttoken = await staking.newRewardDistributionToken(101);
    let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
    let oldBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    await staking.connect(founder).adminBurn(101, "0x9307547d686b2909b4c4eb932777a2d5615dece0", ethers.utils.parseEther("2.666125390411983827"));
    let newBal = await distToken.balanceOf("0x9307547d686b2909b4c4eb932777a2d5615dece0");
    expect(newBal).to.equal(oldBal.sub(ethers.utils.parseEther("2.666125390411983827")));
  });

  it("Should upgrade the vault contract", async () => {
    let NewVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    let newVault = await NewVault.deploy();
    await newVault.deployed();
    await nftx.connect(dao).upgradeChildTo(newVault.address);
  });
  
  // it("Should save stuck fees", async () => {
  //   let newDisttoken = await staking.newRewardDistributionToken(31);
  //   let unusedDisttoken = await staking.unusedRewardDistributionToken(31);
  //   let oldNewBal = await vaults[0].balanceOf(newDisttoken);
  //   let oldUnusedBal = await vaults[0].balanceOf(unusedDisttoken);

  //   await vaults[0].connect(kiwi).saveStuckFees()

  //   let newNewBal = await vaults[0].balanceOf(newDisttoken);
  //   let newUnusedBal = await vaults[0].balanceOf(unusedDisttoken);
  //   expect(oldUnusedBal).to.not.equal(0);
  //   expect(newUnusedBal).to.equal(0);
  //   expect(newNewBal).to.not.equal(0);
  //   expect(newNewBal).to.equal(oldNewBal.add(oldUnusedBal));
  // })

  // it("Should allow claiming rewards after distributing", async () => {
  //   let oldBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   await staking.connect(kiwi).claimRewards(31);
  //   let newBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   expect(newBal).to.not.equal(oldBal);
  // })
});
