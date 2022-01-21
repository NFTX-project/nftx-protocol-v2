import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-gas-reporter';
import 'hardhat-tracer';
import { HardhatUserConfig, task } from 'hardhat/config';
import 'solidity-coverage';
import { networks } from './hardhat.networks';

task('accounts', 'Prints the list of accounts', async (_, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

const config: HardhatUserConfig = {
	solidity: {
		version: '0.8.4',
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000
			}
		}
	},
	networks
};

export default config;
