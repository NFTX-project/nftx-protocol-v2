import { ethers, upgrades } from 'hardhat';
import type { NFTXV1Buyout } from '../typechain';

const founderAddress = '0x8F217D5cCCd08fD9dCe24D6d42AbA2BB4fF4785B';

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log('Deploying account:', await deployer.getAddress());
	console.log('Deploying account balance:', (await deployer.getBalance()).toString(), '\n');

	const NFTXV1Buyout = await ethers.getContractFactory('NFTXV1Buyout');
	const v1Buyout = (await upgrades.deployProxy(NFTXV1Buyout, [], {
		initializer: '__NFTXV1Buyout_init'
	})) as NFTXV1Buyout;
	await v1Buyout.deployed();

	console.log('NFTXV1Buyout:', v1Buyout.address);

	const ProxyController = await ethers.getContractFactory('ProxyControllerSimple');

	const proxyController = await ProxyController.deploy(v1Buyout.address);
	await proxyController.deployed();
	console.log('ProxyController address:', proxyController.address);

	console.log('\nUpdating proxy admin...');

	await upgrades.admin.changeProxyAdmin(v1Buyout.address, proxyController.address);

	console.log('Fetching implementation addresses...');

	await proxyController.fetchImplAddress({
		gasLimit: '150000'
	});

	console.log('Implementation address:', await proxyController.impl());

	console.log('Transfering ownerships...');
	await v1Buyout.transferOwnership(founderAddress);
	await proxyController.transferOwnership(founderAddress);

	console.log('');
}

main()
	.then(() => {
		console.log('\nDeployment completed successfully ✓');
		process.exit(0);
	})
	.catch((error) => {
		console.log('\nDeployment failed ✗');
		console.error(error);
		process.exit(1);
	});
