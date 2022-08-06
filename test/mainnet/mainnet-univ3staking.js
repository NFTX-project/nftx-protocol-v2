const { expect } = require("chai");
const { expectRevert, expectException } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const { zeroPad } = require("ethers/lib/utils");

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, kiwi;
let dev;
let dao;
let founder;

let nftx;
let zap, oldZap;
let staking;
let uniStaking, uniSwapRouter;
let erc721;
let feeDistrib;
let controller;
const vaults = [];

describe("LP Staking Upgrade Migrate Now Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 14827700,
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
      params: ["0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"],
    });
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"],
    });
    
    kiwi = await ethers.provider.getSigner(
      "0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"
    );
    dao = await ethers.provider.getSigner(
      "0x40d73df4f99bae688ce3c23a01022224fe16c7b2"
    );
    founder = await ethers.provider.getSigner(
      "0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B"
    );
    dev = await ethers.provider.getSigner(
      "0xDEA9196Dcdd2173D6E369c2AcC0faCc83fD9346a"
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
      "MultiProxyController",
      "0x35fb4026dcF19f8cA37dcca4D2D68A549548750C"
    );
    feeDistrib = await ethers.getContractAt(
      "NFTXSimpleFeeDistributor",
      "0xFD8a76dC204e461dB5da4f38687AdC9CC5ae4a86"
    );

    uniSwapRouter = await ethers.getContractAt(
      "ISwapRouter",
      "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    );
  });

  it("Should deploy nft staking", async () => {
    const UniV3Staking = await ethers.getContractFactory("NFTXUniV3Staking");
    uniStaking = await upgrades.deployProxy(
      UniV3Staking,
      [
        "0x1F98431c8aD98523631AE4a59f267346ea31F984", //univ3
        "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", // nft manager
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // weth
        "0xBE86f647b167567525cCAAfcd6f881F1Ee558216", // vaultFactory
      ],
      {
        initializer: "__NFTXUniV3Staking_init",
        unsafeAllow: 'delegatecall'
      }
    );
    await uniStaking.deployed();
    await uniStaking.transferOwnership(kiwi.getAddress())
    // await feeDistrib.connect(dev).setInventoryStakingAddress(inventoryStaking.address, {gasLimit: 100000})
    // await feeDistrib.connect(dev).addReceiver(BASE.div(5), inventoryStaking.address, true, {gasLimit: 100000})
  })


  it("Should mint to get some $UWU", async () => {
    vault = await ethers.getContractAt(
      "NFTXVaultUpgradeable",
      "0x5ce188b44266c7b4bbc67afa3d16b2eb24ed1065"
    );
    vaults.push(vault);
    await vaults[0].connect(kiwi).mint([303,525,827,904,1349], [1]);
    // let newBal = await vaults[0].balanceOf(kiwi.getAddress());
    // expect(oldBal).to.not.equal(newBal);
  })

  it("Should initialize uni v3 position for vault 179", async () => {
    const weth = await ethers.getContractAt("contracts/solidity/NFTXStakingZap.sol:IWETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    await weth.connect(kiwi).deposit({value: BASE});
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniStaking.address, BASE.mul(2))
    await weth20.connect(kiwi).approve(uniStaking.address, BASE.div(2))
    await uniStaking.connect(kiwi).initializeUniV3Position(179, BigNumber.from("79228162514264337593543950336"), BigNumber.from("99999999999999999"), BigNumber.from("99999999999999999"))
  });


  it("Should let user create position for vault 179", async () => {
    const weth = await ethers.getContractAt("contracts/solidity/NFTXStakingZap.sol:IWETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    await weth.connect(kiwi).deposit({value: BASE});
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniStaking.address, BASE.mul(2))
    await weth20.connect(kiwi).approve(uniStaking.address, BASE.div(2))

    await uniStaking.connect(kiwi).createStakingPositionNFT(179, BigNumber.from("99999999999999999"), BigNumber.from("99999999999999999"))
    let newBal = await uniStaking.balanceOfNFT(0)
    expect(await uniStaking.ownerOf(0)).to.equal(await kiwi.getAddress())
    expect(newBal.gt(0)).to.equal(true)
  });
  

  it("Should let user increase position for vault 179", async () => {
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniStaking.address, BASE.mul(2))
    await weth20.connect(kiwi).approve(uniStaking.address, BASE.div(2))
    let oldBal = await uniStaking.balanceOfNFT(0)
    await uniStaking.connect(kiwi).addLiquidityToStakingPositionNFT(0, BigNumber.from("99999999999999999"), BigNumber.from("99999999999999999"))
    let newBal = await uniStaking.balanceOfNFT(0)
    expect(newBal.gt(oldBal)).to.equal(true);
  });

  it("Should let user decrease position for vault 179", async () => {
    const weth = await ethers.getContractAt("contracts/solidity/NFTXStakingZap.sol:IWETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniStaking.address, BASE.mul(2))
    await weth20.connect(kiwi).approve(uniStaking.address, BASE.div(2))
    let liq = await uniStaking.balanceOfNFT(0);
    await uniStaking.connect(kiwi).removeLiquidityFromVaultV3Position(0, liq.div(2), BigNumber.from("6999999999999999"), BigNumber.from("6999999999999999"))
    let newLiq = await uniStaking.balanceOfNFT(0);
    expect(newLiq.lt(liq)).to.eq(true)
  });

  it("Should let user swap with vault tokens", async () => {
    const weth = await ethers.getContractAt("contracts/solidity/NFTXStakingZap.sol:IWETH", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");
    await weth.connect(kiwi).deposit({value: BASE});
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniSwapRouter.address, BASE.mul(10))
    await weth20.connect(kiwi).approve(uniSwapRouter.address, BASE.mul(10))

    let params = {
      tokenIn: vaults[0].address,
      tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      fee: 10000,
      recipient: kiwi.getAddress(),
      deadline: 10000000000,
      amountIn: BASE,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: BigNumber.from("4295128800"),
    }
    await uniSwapRouter.connect(kiwi).exactInputSingle(params)
    // console.log(await uniStaking.ownerOf(0))
  });

  it("Should let user claim rewards from trading", async () => {
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    await vaults[0].connect(kiwi).approve(uniSwapRouter.address, BASE.mul(10))
    await weth20.connect(kiwi).approve(uniSwapRouter.address, BASE.mul(10))

    let oldWBal = await weth20.balanceOf(await dao.getAddress())
    let oldVBal = await vaults[0].balanceOf(kiwi.getAddress())
    await uniStaking.connect(kiwi).claimRewardsTo(0, kiwi.getAddress())
    let newWBal = await weth20.balanceOf(await dao.getAddress())
    let newVBal = await vaults[0].balanceOf(kiwi.getAddress())
    expect(newWBal.gt(oldWBal)).to.equal(true)
    expect(newVBal.gt(oldVBal)).to.equal(true)
  });


  it("Should allow fees to come in manually before V3 switch", async () => {
    let oldVBal = await vaults[0].balanceOf(kiwi.getAddress())
    let oldVBalUni = await vaults[0].balanceOf(uniStaking.address)
    await vaults[0].connect(kiwi).approve(uniStaking.address, oldVBal.mul(2))
    await uniStaking.connect(kiwi).receiveRewards(179, oldVBal.div(2))
    let newVBal = await vaults[0].balanceOf(kiwi.getAddress())
    let newVBalUni = await vaults[0].balanceOf(uniStaking.address)
    expect(newVBal.lt(oldVBal)).to.equal(true)
    expect(newVBalUni.gt(oldVBalUni)).to.equal(true)
  })

  it("Should upgrade contracts", async () => {
    // Upgrade fee distributor
    const FeeDistrImpl = await ethers.getContractFactory("NFTXSimpleFeeDistributor");
    const feeDistrImpl = await FeeDistrImpl.deploy();
    await feeDistrImpl.deployed();

    await controller.connect(dao).upgradeProxyTo(1, feeDistrImpl.address);
  })

  it("Should assign V3 staking contract to fee distributor", async () => {
    await feeDistrib.connect(dev).setV3StakingAddress(uniStaking.address);
    expect(await feeDistrib.v3Staking()).to.eq(uniStaking.address)
  })

  it("Should toggle V3 switch for vault 179", async () => {
    await feeDistrib.connect(dev).toggleVaultsToV3([179], true);
    expect(await feeDistrib.v3Toggle(179)).to.eq(true)
  })


  // it("Should have locked balance", async () => {
  //   let newDisttoken = await staking.newRewardDistributionToken(179);
  //   let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
  //   const locked = await staking.lockedUntil(179, kiwi.getAddress());
  //   expect(await staking.lockedLPBalance(179, kiwi.getAddress())).to.equal(
  //     await distToken.balanceOf(kiwi.getAddress())
  //   );
  //   expect(locked).to.be.gt(1625729248);
  // });

  it("Should mint to generate some rewards", async () => {
    let oldBal = await vaults[0].balanceOf(uniStaking.address);
    await vaults[0].connect(kiwi).mint([3586,3906,3958], [1]);
    let newBal = await vaults[0].balanceOf(uniStaking.address);
    expect(oldBal).to.not.equal(newBal);
  })

  it("Should let user claim rewards from minting", async () => {
    const weth20 = await ethers.getContractAt("IERC20Upgradeable", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    // await vaults[0].connect(kiwi).approve(uniSwapRouter.address, BASE.mul(10))

    let oldWBal = await weth20.balanceOf(await dao.getAddress())
    let oldVBal = await vaults[0].balanceOf(kiwi.getAddress())
    await uniStaking.connect(kiwi).claimRewardsTo(0, kiwi.getAddress())
    let newWBal = await weth20.balanceOf(await dao.getAddress())
    let newVBal = await vaults[0].balanceOf(kiwi.getAddress())
    // No WETH to claim since this is just a protocol usage.
    expect(newWBal.eq(oldWBal)).to.equal(true)
    expect(newVBal.gt(oldVBal)).to.equal(true)
  });


  // it("Should not allow to withdraw locked tokens before lock", async () => {
  //   await expectException(staking.connect(kiwi).exit(179), "User locked");
  // });

  // it("Should allow claiming rewards before unlocking", async () => {
  //   let oldBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   await staking.connect(kiwi).claimRewards(179);
  //   let newBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   expect(newBal).to.not.equal(oldBal);
  // })
  
  // it("Should pass some time", async () => {
  //   await ethers.provider.send("evm_increaseTime",  [24*60*60]);
  //   await ethers.provider.send("evm_mine", []);
  // });


  // let noPool1155NFT;
  // let nft1155Id;
  // it("Should create a vault for an ERC1155 token", async () => {
  //   let ERC1155 = await ethers.getContractFactory("ERC1155");
  //   noPool1155NFT = await ERC1155.deploy("");
  //   await noPool1155NFT.deployed();
  //   const response = await nftx.createVault("FAKE", "FAKE", noPool1155NFT.address, true, true);
  //   const receipt = await response.wait(0);
  //   nft1155Id = receipt.events
  //     .find((elem) => elem.event === "NewVault")
  //     .args[0].toString();
  //   const vaultAddr = await nftx.vault(nft1155Id);
  //   await noPool1155NFT.connect(kiwi).publicMintBatch(kiwi.getAddress(), [0, 1, 2, 3], [10, 10, 10, 5]);
  //   let new1155Vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
  //   vaults.push(new1155Vault)
  // });

  // it("Should add mint some for 1155", async () => {
  //   await noPool1155NFT.connect(kiwi).setApprovalForAll(zap.address, true);
  //   await vaults[1].connect(kiwi).approve(zap.address, BASE.mul(1000))
  //   await noPool1155NFT.connect(kiwi).setApprovalForAll(vaults[1].address, true);
  //   await vaults[1].connect(kiwi).mint([3], [4])
  // });

  // it("Should add liquidity with 1155 using weth with no pool for someone else", async () => {
  //   const amountETH = ethers.utils.parseEther("1.0");
  //   const WETH = await zap.WETH();
  //   const weth = await ethers.getContractAt("contracts/solidity/NFTXStakingZap.sol:IWETH", WETH);
  //   await weth.connect(kiwi).deposit({value: amountETH});

  //   const weth20 = await ethers.getContractAt("IERC20Upgradeable", WETH);
  //   await weth20.connect(kiwi).approve(zap.address, BASE.mul(500))
  //   await zap.connect(kiwi).addLiquidity1155To(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, amountETH, primary.getAddress())
  // });

  // it("Should add liquidity with 1155 an eth", async () => {
  //   const amountETH = ethers.utils.parseEther("1.0");
  //   await zap.connect(kiwi).addLiquidity1155ETH(nft1155Id, [0, 1, 2], [5, 5, 5], amountETH, {value: amountETH})
  // });

  // it("Should not allow to withdraw locked tokens for someone else before lock", async () => {
  //   await expectException(staking.connect(primary).exit(nft1155Id), "User locked");
  // });
  // it("Should not allow to withdraw locked tokens before lock", async () => {
  //   await expectException(staking.connect(kiwi).exit(nft1155Id), "User locked");
  // });

  // it("Should not allow to withdraw locked tokens before lock", async () => {
  //   await expectException(staking.connect(kiwi).exit(179), "User locked");
  // });

  // it("Should not allow transfer before lock", async () => {
  //   let newDisttoken = await staking.newRewardDistributionToken(179);
  //   let distToken = await ethers.getContractAt("IERC20Upgradeable", newDisttoken)
  //   await expectException(distToken.connect(kiwi).transfer(dao.getAddress(), 1), "User locked");
  // });

  // it("Should pass some time", async () => {
  //   await ethers.provider.send("evm_increaseTime",  [24*60*60]);
  //   await ethers.provider.send("evm_mine", []);
  // });

  // it("Should distribute current new rewards to new LP token", async () => {
  //   let newDisttoken = await staking.newRewardDistributionToken(179);
  //   let oldBal = await vaults[0].balanceOf(newDisttoken);
  //   await vaults[0].connect(kiwi).mint([2886], [1]);
  //   let newBal = await vaults[0].balanceOf(newDisttoken);
  //   expect(oldBal).to.not.equal(newBal);
  // });

  // it("Should allow to exit and claim locked tokens after lock", async () => {
  //   let oldBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   await staking.connect(kiwi).claimMultipleRewards([179, nft1155Id]);
  //   let newBal = await vaults[0].balanceOf(kiwi.getAddress());
  //   expect(newBal).to.not.equal(oldBal);
  //   expect(await staking.lockedLPBalance(179, kiwi.getAddress())).to.equal(0);
  // });

  // it("Should pass some time", async () => {
  //   await ethers.provider.send("evm_increaseTime",  [24*60*60]);
  //   await ethers.provider.send("evm_mine", []);
  // });

  // it("Should allow to withdraw locked tokens for someone else after lock", async () => {
  //   await staking.connect(primary).exit(nft1155Id);
  // });

  // it("Should allow to withdraw locked 1155 tokens after lock", async () => {
  //   await staking.connect(kiwi).exit(nft1155Id);
  // });
});
