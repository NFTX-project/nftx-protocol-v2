const { expect } = require("chai");
const { expectRevert } = require("../../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const BASE = BigNumber.from(10).pow(18);
const PERC1_FEE = BASE.div(100);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, dao, gaus;
let nftx;
let staking;
let erc721;
let erc1155;
const vaults = [];

const numLoops = 5;
const numTokenIds = numLoops;

describe("NFTX Distro Test", function () {
  before("Setup", async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
            blockNumber: 12916031,
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
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"]}
    );
    
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2")

    nftx = await ethers.getContractAt("NFTXVaultFactoryUpgradeable", "0xBE86f647b167567525cCAAfcd6f881F1Ee558216");
    let ERC721 = await ethers.getContractFactory("NFTMintDistro");
    erc721 = await ERC721.deploy();
    await erc721.deployed(); 
  });

  it("Should let the DAO upgrade the vault contracts to updated implementation", async () => {
    let NewVault = await ethers.getContractFactory("NFTXVaultUpgradeable");
    let newImpl = await NewVault.deploy();
    await newImpl.deployed();
    await nftx.connect(dao).upgradeChildTo(newImpl.address);
  })

  ////////////////////////////
  // Vault 0: ERC721, Basic //
  ////////////////////////////

  let vaultId;
  it("Should let the distro contract create a vault", async () => {
    vaultId = await nftx.numVaults()
    await erc721.createVault();
  });

  it("Should let the owner insert ids into the vault", async () => {
    await erc721.insertIds(200);
  });

  it("Should let a user buy some tokens", async () => {
    await erc721.reserve(10);
  });

  it("Should let a user mint some tokens", async () => {
    await erc721.mint(10);
  });

  // it("Should let the user redeem randomly from NFTX", async () => {
  //   const vaultAddr = await nftx.vault(vaultId);
  //   vault = await ethers.getContractAt("NFTXVaultUpgradeable", vaultAddr);
  //   vaults.push(vault)

  //   await vault.redeem(10, []);
  //   expect(await erc721.balanceOf(primary.address)).to.equal(10);
  // });

  // it("Should allow all vault features for PUNK", async () => {
  //   await vaults[0].connect(quag).setVaultFeatures(true, true, true);
  //   expect(await vaults[0].enableMint()).to.eq(true);
  //   expect(await vaults[0].enableRandomRedeem()).to.eq(true);
  //   expect(await vaults[0].enableTargetRedeem()).to.eq(true);
  // });

  // it("Should allow someone else to mint gaus's punk before upgrade", async () => {
  //   const tokenId = 6666;
  //   await vaults[0].connect(bob).mint([tokenId], [1]);
  //   expect(await erc721.balanceOf(gaus.getAddress())).to.equal(12);
  //   expect(await erc721.balanceOf(vaults[0].address)).to.equal("4");
  //   expect(await vaults[0].balanceOf(gaus.getAddress())).to.equal(
  //     0
  //   );
  //   expect(await vaults[0].balanceOf(bob.address)).to.equal(
  //     BASE
  //   );
  // });
})
