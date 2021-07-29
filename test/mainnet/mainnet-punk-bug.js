const { expect } = require("chai");
const { expectRevert } = require("../utils/expectRevert");

const { BigNumber } = require("@ethersproject/bignumber");
const { ethers, upgrades } = require("hardhat");

const addresses = require("../addresses/rinkeby.json");

const BASE = BigNumber.from(10).pow(18);
const PERC1_FEE = BASE.div(100);
const zeroAddr = "0x0000000000000000000000000000000000000000";
const notZeroAddr = "0x000000000000000000000000000000000000dead";

let primary, alice, bob, punkOwner, quag, dao, gaus;
let nftx;
let staking;
let erc721;
let erc1155;
let flashBorrower;
const vaults = [];

const numLoops = 5;
const numTokenIds = numLoops;

describe("Mainnet Fork Punk Attack Regression Test", function () {
  before("Setup", async () => {
    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];
    bob = signers[2];
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48"]}
    );
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x40d73df4f99bae688ce3c23a01022224fe16c7b2"]}
    );
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x3fce5449c7449983e263227c5aaeacb4a80b87c9"]}
    );
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xf3cad40f7f7b43ae2a4226a8c53420569458710c"]}
    );
    
    punkOwner = await ethers.provider.getSigner("0x08D816526BdC9d077DD685Bd9FA49F58A5Ab8e48")
    dao = await ethers.provider.getSigner("0x40d73df4f99bae688ce3c23a01022224fe16c7b2")
    quag = await ethers.provider.getSigner("0x3fce5449c7449983e263227c5aaeacb4a80b87c9")
    gaus = await ethers.provider.getSigner("0xf3cad40f7f7b43ae2a4226a8c53420569458710c")

    vault = await ethers.getContractAt("NFTXVaultUpgradeable", "0x269616d549d7e8eaa82dfb17028d0b212d11232a");
    vaults.push(vault)

    nftx = await ethers.getContractAt("NFTXVaultFactoryUpgradeable", "0xBE86f647b167567525cCAAfcd6f881F1Ee558216");
    erc721 = await ethers.getContractAt("CryptoPunksMarket", "0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB");
  });

  ////////////////////////////
  // Vault 0: ERC721, Basic //
  ////////////////////////////

  it("Should let the dao unpause all vault actions", async () => {
    await nftx.connect(dao).unpause(0);
    await nftx.connect(dao).unpause(1);
    await nftx.connect(dao).unpause(2);
    await nftx.connect(dao).unpause(3);
    await nftx.connect(dao).unpause(4);
  });

  it("Should allow all vault features for PUNK", async () => {
    await vaults[0].connect(quag).setVaultFeatures(true, true, true);
    expect(await vaults[0].enableMint()).to.eq(true);
    expect(await vaults[0].enableRandomRedeem()).to.eq(true);
    expect(await vaults[0].enableTargetRedeem()).to.eq(true);
  });

  it("Should approve punks by gaus", async () => {
    const tokenId = 6666;
    expect(await erc721.balanceOf(gaus.getAddress())).to.equal(13);
    await erc721.connect(gaus).offerPunkForSaleToAddress(tokenId, 0, vaults[0].address);
  });

  it("Should allow someone else to mint gaus's punk before upgrade", async () => {
    const tokenId = 6666;
    await vaults[0].connect(bob).mint([tokenId], [1]);
    expect(await erc721.balanceOf(gaus.getAddress())).to.equal(12);
    expect(await erc721.balanceOf(vaults[0].address)).to.equal("4");
    expect(await vaults[0].balanceOf(gaus.getAddress())).to.equal(
      0
    );
    expect(await vaults[0].balanceOf(bob.address)).to.equal(
      BASE
    );
  });

  it("Should let the DAO upgrade the vault contracts to fixed implementation", async () => {
    await nftx.connect(dao).upgradeChildTo("0x20EA6c6c0F3d4405efC3E11466E314Fa7F4dB6A3")
  })

  it("Should allow approving punks by punk owner", async () => {
    const tokenId = 9535;
    expect(await erc721.balanceOf(punkOwner.getAddress())).to.equal(1);
    await erc721.connect(punkOwner).offerPunkForSaleToAddress(tokenId, 0, vaults[0].address);
  });

  it("Should not allow someone else to mint punk owners punk", async () => {
    const tokenId = 9535;
    await expectRevert(vaults[0].connect(bob).mint([tokenId], [1]), "Not the owner");
    expect(await erc721.balanceOf(punkOwner.getAddress())).to.equal(1);
    expect(await erc721.balanceOf(vaults[0].address)).to.equal(4);
    expect(await vaults[0].balanceOf(punkOwner.getAddress())).to.equal(
      0
    );
  });

  it("Should allow punk owner to mint", async () => {
    const tokenId = 9535;
    await vaults[0].connect(punkOwner).mint([tokenId], [1]);
    expect(await erc721.balanceOf(punkOwner.getAddress())).to.equal(0);
    expect(await erc721.balanceOf(vaults[0].address)).to.equal(5);
    expect(await vaults[0].balanceOf(punkOwner.getAddress())).to.equal(
      BASE.mul(1)
    );
  });
})
