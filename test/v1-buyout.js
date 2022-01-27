const { expect } = require('chai');
const { expectException } = require('../utils/expectRevert');

const { BigNumber } = require('@ethersproject/bignumber');
const { ethers, upgrades } = require('hardhat');

const addresses = require('../addresses/rinkeby.json');

const BASE = BigNumber.from(10).pow(18);
const zeroAddr = '0x0000000000000000000000000000000000000000';
const notZeroAddr = '0x000000000000000000000000000000000000dead';

let primary;
let alice;
let bob;
let charlie;
let buyout;
let xToken;
let xToken2;
let xToken3;

describe('V1 Buyout', function () {
	before('Setup', async () => {
		signers = await ethers.getSigners();
		primary = signers[0];
		alice = signers[1];
		bob = signers[2];
		charlie = signers[3];

		const Buyout = await ethers.getContractFactory('NFTXV1Buyout');
		buyout = await upgrades.deployProxy(Buyout, [], {
			initializer: '__NFTXV1Buyout_init'
		});
		await buyout.deployed();

		const XToken = await ethers.getContractFactory('DummyXToken');
		xToken = await XToken.deploy();
		await xToken.deployed();

		xToken2 = await XToken.deploy();
		await xToken2.deployed();

		xToken3 = await XToken.deploy();
		await xToken3.deployed();
	});

	it('Should recognize the deployer as owner', async () => {
		expect(await buyout.owner()).to.equal(await primary.getAddress());
	});

	it('Should not allow owner to buyout token with 0 eth', async () => {
		await expectException(buyout.addBuyout(zeroAddr), 'Cannot pair with 0 ETH');
	});

	it('Should not initiailzie again', async () => {
		await expectException(buyout.__NFTXV1Buyout_init(), 'contract is already');
	});

	it('Should allow the owner to set a buyout with 4 eth', async () => {
		await buyout.addBuyout(xToken.address, { value: ethers.utils.parseEther('4') });
		expect(await buyout.ethAvailiable(xToken.address)).to.equal(ethers.utils.parseEther('4'));
		expect(await ethers.provider.getBalance(buyout.address)).to.equal(ethers.utils.parseEther('4'));
	});

	it('Should let owner emergency withdraw all eth and then clear buyout', async () => {
		const oldBal = await ethers.provider.getBalance(primary.address);
		await buyout.emergencyWithdraw();
		const newBal = await ethers.provider.getBalance(primary.address);
		expect(await ethers.provider.getBalance(buyout.address)).to.equal('0');
		expect(newBal).to.gt(oldBal.add(ethers.utils.parseEther('4')).sub(ethers.utils.parseEther('0.1')));
		expect(await buyout.ethAvailiable(xToken.address)).to.equal(ethers.utils.parseEther('4'));
		await buyout.clearBuyout(xToken.address);
		expect(await buyout.ethAvailiable(xToken.address)).to.equal('0');
	});

	it('Should allow the owner to add back a buyout with 4 eth', async () => {
		await buyout.addBuyout(xToken.address, { value: ethers.utils.parseEther('4') });
		expect(await buyout.ethAvailiable(xToken.address)).to.equal(ethers.utils.parseEther('4'));
		expect(await ethers.provider.getBalance(buyout.address)).to.equal(ethers.utils.parseEther('4'));
	});

	it('Should mint tokens for everyone', async () => {
		await xToken.connect(alice).mint(await alice.getAddress(), ethers.utils.parseEther('1'));
		await xToken.connect(bob).mint(await bob.getAddress(), ethers.utils.parseEther('2'));
		await xToken.connect(charlie).mint(await charlie.getAddress(), ethers.utils.parseEther('1'));
	});

	it('Should be able to claim a quarter of eth for quarter of tokens', async () => {
		await xToken.connect(alice).approve(buyout.address, ethers.utils.parseEther('1'));
		const oldBal = await ethers.provider.getBalance(alice.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(alice).claimETH(xToken.address);
		const newBal = await ethers.provider.getBalance(alice.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther('0.90')));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(oldBuyoutBal.div(4)));
	});

	it('Should be able to claim a 2/3rds of remaining eth with 2/3rds of tokens', async () => {
		await xToken.connect(bob).approve(buyout.address, ethers.utils.parseEther('2'));
		const oldBal = await ethers.provider.getBalance(bob.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(bob).claimETH(xToken.address);
		const newBal = await ethers.provider.getBalance(bob.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther('1.90')));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(oldBuyoutBal.div(3).mul(2)));
	});

	it('Should claim all remaining eth with remaining amount of tokens', async () => {
		await xToken.connect(charlie).approve(buyout.address, ethers.utils.parseEther('1'));
		const oldBal = await ethers.provider.getBalance(charlie.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(charlie).claimETH(xToken.address);
		const newBal = await ethers.provider.getBalance(charlie.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther('0.90')));
		expect(newBuyoutBal).to.equal('0');
	});

	it('Should allow the owner to set a buyout with 10 eth', async () => {
		await buyout.addBuyout(xToken2.address, { value: ethers.utils.parseEther('10') });
		expect(await buyout.ethAvailiable(xToken2.address)).to.equal(ethers.utils.parseEther('10'));
		expect(await ethers.provider.getBalance(buyout.address)).to.equal(ethers.utils.parseEther('10'));
	});

	it('Should mint fractions of tokens for everyone', async () => {
		await xToken2.connect(alice).mint(await alice.getAddress(), ethers.utils.parseEther('2.5'));
		await xToken2.connect(bob).mint(await bob.getAddress(), ethers.utils.parseEther('3.33'));
		await xToken2.connect(charlie).mint(await charlie.getAddress(), ethers.utils.parseEther((10 - 2.5 - 3.33).toString()));
	});

	it('Should be able to claim a 1/3rd of eth for 1/3rd of tokens', async () => {
		await xToken2.connect(bob).approve(buyout.address, ethers.utils.parseEther('3.33'));
		const oldBal = await ethers.provider.getBalance(bob.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(bob).claimETH(xToken2.address);
		const newBal = await ethers.provider.getBalance(bob.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther('3.20')));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(ethers.utils.parseEther('3.33')));
	});

	it('Should allow the owner to set another concurrent buyout with 10 eth', async () => {
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.addBuyout(xToken3.address, { value: ethers.utils.parseEther('10') });
		expect(await buyout.ethAvailiable(xToken3.address)).to.equal(ethers.utils.parseEther('10'));
		expect(await ethers.provider.getBalance(buyout.address)).to.equal(oldBuyoutBal.add(ethers.utils.parseEther('10')));
	});

	it('Should mint fractions of tokens for everyone', async () => {
		await xToken3.connect(alice).mint(await alice.getAddress(), ethers.utils.parseEther('2.5'));
		await xToken3.connect(bob).mint(await bob.getAddress(), ethers.utils.parseEther('5'));
		await xToken3.connect(charlie).mint(await charlie.getAddress(), ethers.utils.parseEther('2.5'));
	});

	it('Should be able to claim a portion of eth for a portion of tokens', async () => {
		await xToken2.connect(charlie).approve(buyout.address, ethers.utils.parseEther((10 - 2.5 - 3.33).toString()));
		const oldBal = await ethers.provider.getBalance(charlie.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(charlie).claimETH(xToken2.address);
		const newBal = await ethers.provider.getBalance(charlie.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther((10 - 2.5 - 3.33).toString()).sub(ethers.utils.parseEther('0.1'))));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(ethers.utils.parseEther((10 - 2.5 - 3.33).toString())));
	});

	it('Should allow the owner to remove a buyout and receive proper amount of eth', async () => {
		const oldBal = await ethers.provider.getBalance(primary.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		const oldEth = await buyout.ethAvailiable(xToken2.address);
		await buyout.removeBuyout(xToken2.address);
		const newBal = await ethers.provider.getBalance(primary.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(await buyout.ethAvailiable(xToken2.address)).to.equal('0');
		expect(await buyout.ethAvailiable(xToken3.address)).to.equal(ethers.utils.parseEther('10'));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(oldEth));
		expect(newBal).to.be.gt(oldBal.add(oldEth).sub(ethers.utils.parseEther('0.15')));
	});

	it('Should be able to claim portion of eth for portion of tokens', async () => {
		await xToken3.connect(alice).approve(buyout.address, ethers.utils.parseEther('2.5'));
		const oldBal = await ethers.provider.getBalance(alice.address);
		const oldBuyoutBal = await ethers.provider.getBalance(buyout.address);
		await buyout.connect(alice).claimETH(xToken3.address);
		const newBal = await ethers.provider.getBalance(alice.address);
		const newBuyoutBal = await ethers.provider.getBalance(buyout.address);
		expect(await ethers.provider.getBalance(buyout.address)).to.equal(ethers.utils.parseEther('7.5'));
		expect(await buyout.ethAvailiable(xToken3.address)).to.equal(ethers.utils.parseEther('7.5'));
		expect(newBal).to.be.gt(oldBal.add(ethers.utils.parseEther('2.5').sub(ethers.utils.parseEther('0.1'))));
		expect(newBuyoutBal).to.equal(oldBuyoutBal.sub(ethers.utils.parseEther('2.5')));
	});
});
