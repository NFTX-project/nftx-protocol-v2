const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

// Store our deployer and a range of test users
let deployer, alice, bob, carol, users;

// Store our eligibility contract
let eligibility;

// Store our mock LINK token
let erc20;


describe('NFTXArtBlocksCuratedEligibility', function () {

  before('Setup', async () => {
    // Set up our users
    [deployer, alice, bob, carol, ...users] = await ethers.getSigners();

    // Set up our ERC20 mock LINK token
    const ERC20 = await ethers.getContractFactory("MockERC20");
    erc20 = await ERC20.deploy('ChainLink', 'LINK');
    await erc20.deployed();

    // Deploy a mocked ArtBlocks contrct
    let ArtBlocksMock = await ethers.getContractFactory('MockArtBlocks');
    artBlocks = await ArtBlocksMock.deploy();

    // Deploy a mock Oracle contract
    const Oracle = await ethers.getContractFactory("MockOracle");
    oracle = await Oracle.deploy();
    await oracle.deployed();

    // Deploy our eligibility module
    let NFTXArtBlocksCuratedEligibility = await ethers.getContractFactory('NFTXArtBlocksCuratedEligibility');
    eligibility = await NFTXArtBlocksCuratedEligibility.deploy(
      artBlocks.address,
      erc20.address,
      oracle.address,
      '0x3764383061363338366566353433613361626235323831376636373037653362'
    );
    await eligibility.deployed();

    // Mint some "LINK" tokens to our deployer
    await erc20.mint(deployer.address, '100000000000000000000');
    expect(await erc20.balanceOf(deployer.address)).to.equal('100000000000000000000');
  });

  describe('Generic function tests', function () {

    it('Should return expected eligibility name', async () => {
      expect(await eligibility.name()).to.equal('CuratedArtBlocks');
    });

    it('Should return expected target asset', async () => {
      expect(await eligibility.targetAsset()).to.equal('0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270');
    });

    it('Should return expected finalized state', async () => {
      expect(await eligibility.finalized()).to.equal(true);
    });

    it('Should be able to deposit LINK tokens', async () => {
      await erc20.connect(deployer).transfer(eligibility.address, '75000000000000000000');

      expect(await erc20.balanceOf(deployer.address)).to.equal('25000000000000000000');
      expect(await erc20.balanceOf(eligibility.address)).to.equal('75000000000000000000');
    });

    it('Should prevent a non-owner from being able to withdraw LINK tokens', async () => {
      await expect(eligibility.connect(alice).withdrawLink()).to.be.revertedWith('Only callable by owner');

      expect(await erc20.balanceOf(alice.address)).to.equal('0');
      expect(await erc20.balanceOf(deployer.address)).to.equal('25000000000000000000');
      expect(await erc20.balanceOf(eligibility.address)).to.equal('75000000000000000000');
    });

    it('Should be able to withdraw LINK tokens', async () => {
      expect(await erc20.balanceOf(deployer.address)).to.equal('25000000000000000000');
      expect(await erc20.balanceOf(eligibility.address)).to.equal('75000000000000000000');

      await eligibility.withdrawLink();

      expect(await erc20.balanceOf(deployer.address)).to.equal('100000000000000000000');
      expect(await erc20.balanceOf(eligibility.address)).to.equal('0');
    });

    it('Should map a token ID to a project ID when not cached', async () => {
      await artBlocks.setProjectId(1);

      expect(await eligibility.tokenProjectIds(0)).to.equal(0);

      await eligibility.tokenIdToProjectId(0);
      expect(await eligibility.tokenProjectIds(0)).to.equal(1);
    });

    it('Should map a token ID to an existing project ID when cached', async () => {
      expect(await eligibility.tokenProjectIds(1)).to.equal(0);

      await artBlocks.setProjectId(4);
      await eligibility.tokenIdToProjectId(1);
      expect(await eligibility.tokenProjectIds(1)).to.equal(4);

      await artBlocks.setProjectId(5);
      await eligibility.tokenIdToProjectId(1);
      expect(await eligibility.tokenProjectIds(1)).to.equal(4);
    });

  });

  describe('Initial data import tests', function () {

    it('Should prevent empty project IDs from being processed', async () => {
      await expect(eligibility.setProjectEligibility([], [])).to.be.reverted;
      await expect(eligibility.setProjectEligibility([], [true, false])).to.be.reverted;
      await expect(eligibility.setProjectEligibility([0], [true, false])).to.be.reverted;
    });

    it('Should prevent missing eligibility data from being processed', async () => {
      await expect(eligibility.setProjectEligibility([], [])).to.be.reverted;
      await expect(eligibility.setProjectEligibility([0], [])).to.be.reverted;
      await expect(eligibility.setProjectEligibility([0, 1], [true])).to.be.reverted;
    });

    it('Should allow for a single project to be added', async () => {
      await eligibility.setProjectEligibility([0], [false]);

      // 2 means false
      expect(await eligibility.projectEligibility(0)).to.equal(2);
    });

    it('Should allow for multiple projects to be added at once', async () => {
      await eligibility.setProjectEligibility([1, 2, 3], [true, false, true]);

      // 1 means true, 2 means false
      expect(await eligibility.projectEligibility(1)).to.equal(1);
      expect(await eligibility.projectEligibility(2)).to.equal(2);
      expect(await eligibility.projectEligibility(3)).to.equal(1);
    });

    it('Should prevent existing project eligibilities from being edited', async () => {
      await eligibility.setProjectEligibility([4, 5], [false, false]);
      await eligibility.setProjectEligibility([4, 5], [true, true]);

      // 1 means true, 2 means false
      expect(await eligibility.projectEligibility(4)).to.equal(2);
      expect(await eligibility.projectEligibility(5)).to.equal(2);
    });

    it('Should allow packed booleans to be sent to our alternative import method (gas test)', async () => {
      await eligibility.setProjectEligibilityPackedBooleans(
        // We set up 15 projects
        [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        // We set up 2 packed booleans (10011011, 1001000)
        [155, 72]
      );

      // 1 means true, 2 means false
      expect(await eligibility.projectEligibility(6)).to.equal(1);
      expect(await eligibility.projectEligibility(7)).to.equal(2);
      expect(await eligibility.projectEligibility(8)).to.equal(2);
      expect(await eligibility.projectEligibility(9)).to.equal(1);
      expect(await eligibility.projectEligibility(10)).to.equal(1);
      expect(await eligibility.projectEligibility(11)).to.equal(2);
      expect(await eligibility.projectEligibility(12)).to.equal(1);
      expect(await eligibility.projectEligibility(13)).to.equal(1);
      expect(await eligibility.projectEligibility(14)).to.equal(1);
      expect(await eligibility.projectEligibility(15)).to.equal(2);
      expect(await eligibility.projectEligibility(16)).to.equal(2);
      expect(await eligibility.projectEligibility(17)).to.equal(1);
      expect(await eligibility.projectEligibility(18)).to.equal(2);
      expect(await eligibility.projectEligibility(19)).to.equal(2);
      expect(await eligibility.projectEligibility(20)).to.equal(2);
    });

    it('Should allow for a large number of eligibility updates (gas test)', async () => {
      // Set up to create the exact same output as the other gas test
      await eligibility.setProjectEligibility(
        [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
        [true, false, false, true, true, false, true, true, true, false, false, true, false, false, false]
      );

      expect(await eligibility.projectEligibility(21)).to.equal(1);
      expect(await eligibility.projectEligibility(22)).to.equal(2);
      expect(await eligibility.projectEligibility(23)).to.equal(2);
      expect(await eligibility.projectEligibility(24)).to.equal(1);
      expect(await eligibility.projectEligibility(25)).to.equal(1);
      expect(await eligibility.projectEligibility(26)).to.equal(2);
      expect(await eligibility.projectEligibility(27)).to.equal(1);
      expect(await eligibility.projectEligibility(28)).to.equal(1);
      expect(await eligibility.projectEligibility(29)).to.equal(1);
      expect(await eligibility.projectEligibility(30)).to.equal(2);
      expect(await eligibility.projectEligibility(31)).to.equal(2);
      expect(await eligibility.projectEligibility(32)).to.equal(1);
      expect(await eligibility.projectEligibility(33)).to.equal(2);
      expect(await eligibility.projectEligibility(34)).to.equal(2);
      expect(await eligibility.projectEligibility(35)).to.equal(2);
    });

  });

  describe('Token eligibility processing tests', function () {

    it('Should correctly detect token projects that have not been added as requiring processing', async () => {
      await artBlocks.setProjectId(100);
      await eligibility.requiresProcessing(100);
    });

    it('Should correctly detect token projects that have already been added as not requiring processing', async () => {
      await artBlocks.setProjectId(37);
      expect(await eligibility.requiresProcessing(37)).to.equal(true);
      await eligibility.processToken(37);
      expect(await eligibility.requiresProcessing(37)).to.equal(false);
    });

    xit('Should prevent tokens that have already been processed from being processed again', async () => {
      // This will have been processed already in the previous test suite
      expect(await eligibility.processToken(37)).to.be.reverted;
    });

    xit('Should emit processing event and return the requestId when successfully starting processing', async () => {

    });

    xit('Should emit a processing completion event from our fulfillment', async () => {

    });

  });

  describe('Eligibility tests', function () {

    xit('Should mark a token with a curated project as eligible', async () => {

    });

    xit('Should mark a token without a curated project as not eligible', async () => {

    });

    xit('Should mark an unprocessed project\'s token as not eligible', async () => {

    });

  });

});
