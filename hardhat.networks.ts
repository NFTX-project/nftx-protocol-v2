import type { NetworksUserConfig } from 'hardhat/types';
import { alchemyMainnetKey, alchemyRinkebyKey, infuraPalmKey } from './config';

export const networks: NetworksUserConfig = {
	hardhat: {
		mining: {
			auto: true
		},
		forking: {
			url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyMainnetKey}`,
			blockNumber: 12772572
		}
	},
	rinkeby: {
		url: `https://eth-rinkeby.alchemyapi.io/v2/${alchemyRinkebyKey}`,
		accounts: [`0x${process.env.DEV_PRIVATE_KEY}`]
	},
	mainnet: {
		url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyMainnetKey}`,
		accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
		gasPrice: 200000000000
	},
	palm: {
		url: `https://palm-mainnet.infura.io/v3/${infuraPalmKey}`,
		accounts: [`0x${process.env.DEV_PRIVATE_KEY}`]
	}
};
