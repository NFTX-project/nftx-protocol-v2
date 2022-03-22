const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("../utils/expectRevert");

let primary, alice;
let registry;

const zeroAddr = "0x0000000000000000000000000000000000000000";

const zaps = {
  marketplace: {
    address: "0x0000000000000000000000000000000000000001",
    name: "MarketplaceZap",
  },
  staking: {
    address: "0x0000000000000000000000000000000000000002",
    name: "StakingZap",
  },
  unstaking: {
    address: "0x0000000000000000000000000000000000000003" /* just for testing */,
    name: "UnstakingZap",
  },
  claimAndStake: {
    address: "0x0000000000000000000000000000000000000004" /* just for testing */,
    name: "ClaimAndStakeZap",
  },
};

describe("Mainnet unstaking test ERC721", function () {
  before("Setup", async () => {
    signers = await ethers.getSigners();
    primary = signers[0];
    alice = signers[1];

    let ZapRegistry = await ethers.getContractFactory("ZapRegistry");
    registry = await ZapRegistry.deploy();
    await registry.deployed();
  });

  it("Should run tests", async () => {
    await registry.addZap(zaps.marketplace.address, zaps.marketplace.name);
    await registry.addZap(zaps.staking.address, zaps.staking.name);
    await registry.addZap(zaps.unstaking.address, zaps.unstaking.name);
    await registry.addZap(zaps.claimAndStake.address, zaps.claimAndStake.name);

    await registry.findAndRemoveZap(zaps.staking.address);
    await registry.removeZapAt(0);

    await registry.addZap(zaps.marketplace.address, zaps.marketplace.name);
    await registry.addZap(zaps.staking.address, zaps.staking.name);

    await expectRevert(registry.addZap(zaps.staking.address, "StakingZap2"));
    await expectRevert(registry.addZap(zeroAddr, "StakingZap"));

    expect(await registry.isAZap(zaps.staking.address)).to.equal(true);
    expect(await registry.isTheZap(zaps.staking.address, zaps.staking.name)).to.equal(true);
    expect(await registry.isTheZap(zaps.staking.address, zaps.unstaking.name)).to.equal(false);

    await registry.updateZapName(zaps.staking.address, "StakingZap2");
    expect(await registry.isAZap(zaps.staking.address)).to.equal(true);
    expect(await registry.isTheZap(zaps.staking.address, zaps.staking.name)).to.equal(false);
    expect(await registry.isTheZap(zaps.staking.address, "StakingZap2")).to.equal(true);

    await registry.updateZapAddress(zaps.staking.address, zeroAddr);
    expect(await registry.isAZap(zaps.staking.address)).to.equal(false);
    expect(await registry.isAZap(zeroAddr)).to.equal(true);
    expect(await registry.isTheZap(zeroAddr, zaps.staking.name)).to.equal(false);
    expect(await registry.isTheZap(zeroAddr, "StakingZap2")).to.equal(true);

    await registry.findAndRemoveZap(zeroAddr);
    await expectRevert(registry.connect(alice).addZap(zaps.staking.address, zaps.staking.name));
    await expectRevert(registry.connect(alice).findAndRemoveZap(zaps.unstaking.address));
    await expectRevert(registry.connect(alice).removeZapAt(0));
    await expectRevert(registry.connect(alice).updateZapName(zaps.unstaking.address, "AliceZap"));
    await expectRevert(registry.connect(alice).updateZapAddress(zaps.unstaking.address, zeroAddr));

    await registry.addZap(zaps.staking.address, zaps.staking.name);

    let zapAddresses = await registry.getAllZapAddresses();
    let zapNames = await registry.connect(alice).getAllZapNames();
    console.log("zapAddresses:", zapAddresses);
    console.log("zapNames:", zapNames);

    expect(zapAddresses[3]).to.equal(zaps.staking.address);
    expect(zapNames[3]).to.equal(zaps.staking.name);

    expect(await registry.getZapAddressAt(3)).to.equal(zaps.staking.address);
    expect(await registry.getZapNameAt(3)).to.equal(zaps.staking.name);
    expect(await registry.getZapName(zaps.staking.address)).to.equal(zaps.staking.name);
    expect(await registry.isNameTaken(zaps.staking.name)).to.equal(true);
    expect(await registry.isNameTaken("AliceZap")).to.equal(false);
    expect(await registry.indexOfZap(zaps.staking.address)).to.equal(3);
    expect(await registry.numberOfZaps()).to.equal(4);
  });
});
