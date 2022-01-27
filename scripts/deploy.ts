import { ethers, upgrades } from 'hardhat';
import type { NFTXEligibilityManager, NFTXLPStaking, NFTXSimpleFeeDistributor, NFTXVaultFactoryUpgradeable } from '../typechain';

const notZeroAddr = '0x000000000000000000000000000000000000dead';
const ownerAddress = '';

async function main() {
	const [deployer] = await ethers.getSigners();

	console.log('Deploying account:', await deployer.getAddress());
	console.log('Deploying account balance:', (await deployer.getBalance()).toString(), '\n');

	const StakingProvider = await ethers.getContractFactory('MockStakingProvider');
	const provider = await StakingProvider.deploy();
	await provider.deployed();
	console.log('MockStakingProvider:', provider.address);

	const Staking = await ethers.getContractFactory('NFTXLPStaking');
	const staking = (await upgrades.deployProxy(Staking, [provider.address], {
		initializer: '__NFTXLPStaking__init'
	})) as NFTXLPStaking;
	await staking.deployed();
	console.log('Staking:', staking.address);

	const Vault = await ethers.getContractFactory('NFTXVaultUpgradeable');
	const vault = await Vault.deploy();
	await vault.deployed();
	console.log('Vault template:', vault.address);

	const FeeDistributor = await ethers.getContractFactory('NFTXFeeDistributor');
	const feeDistrib = (await upgrades.deployProxy(FeeDistributor, [staking.address, notZeroAddr], {
		initializer: '__FeeDistributor__init__'
	})) as NFTXSimpleFeeDistributor;
	await feeDistrib.deployed();
	console.log('FeeDistributor:', feeDistrib.address);

	const Nftx = await ethers.getContractFactory('NFTXVaultFactoryUpgradeable');
	const nftx = (await upgrades.deployProxy(Nftx, [vault.address, feeDistrib.address], {
		initializer: '__NFTXVaultFactory_init'
	})) as NFTXVaultFactoryUpgradeable;
	await nftx.deployed();
	console.log('VaultFactory:', nftx.address);

	await feeDistrib.setNFTXVaultFactory(nftx.address);
	await staking.setNFTXVaultFactory(nftx.address);

	const Elig = await ethers.getContractFactory('NFTXEligibilityManager');
	const eligManager = (await upgrades.deployProxy(Elig, [], {
		initializer: '__NFTXEligibilityManager_init'
	})) as NFTXEligibilityManager;
	await eligManager.deployed();

	await nftx.setEligibilityManager(eligManager.address);
	console.log('EligibilityManager:', eligManager.address);

	const ListElig = await ethers.getContractFactory('NFTXListEligibility');
	const listElig = await ListElig.deploy();
	await listElig.deployed();
	await eligManager.addModule(listElig.address);

	const RangeElig = await ethers.getContractFactory('NFTXRangeEligibility');
	const rangeElig = await RangeElig.deploy();
	await rangeElig.deployed();
	await eligManager.addModule(rangeElig.address);

	const Gen0Elig = await ethers.getContractFactory('NFTXGen0KittyEligibility');
	const gen0Elig = await Gen0Elig.deploy();
	await gen0Elig.deployed();
	await eligManager.addModule(gen0Elig.address);

	const ProxyController = await ethers.getContractFactory('ProxyController');

	// @ts-expect-error This is older code. When this script was written the parameters were correct.
	const proxyController = await ProxyController.deploy(nftx.address, eligManager.address, staking.address, feeDistrib.address);
	await proxyController.deployed();
	console.log('ProxyController address:', proxyController.address);
	await upgrades.admin.changeProxyAdmin(nftx.address, proxyController.address);
	await upgrades.admin.changeProxyAdmin(eligManager.address, proxyController.address);
	await upgrades.admin.changeProxyAdmin(staking.address, proxyController.address);
	await upgrades.admin.changeProxyAdmin(feeDistrib.address, proxyController.address);

	await proxyController.fetchImplAddress(0, {
		gasLimit: '150000'
	});
	await proxyController.fetchImplAddress(1, {
		gasLimit: '150000'
	});
	await proxyController.fetchImplAddress(2, {
		gasLimit: '150000'
	});
	await proxyController.fetchImplAddress(3, {
		gasLimit: '150000'
	});

	if (ownerAddress) {
		await provider.transferOwnership(ownerAddress);
		await staking.transferOwnership(ownerAddress);
		await feeDistrib.transferOwnership(ownerAddress);
		await nftx.transferOwnership(ownerAddress);
		await eligManager.transferOwnership(ownerAddress);
		await proxyController.transferOwnership(ownerAddress);
	}
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
