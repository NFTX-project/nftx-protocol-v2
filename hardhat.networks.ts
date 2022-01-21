import type { NetworksUserConfig } from 'hardhat/types';
import { alchemyMainnetKey, alchemyRinkebyKey, devPrivateKey, infuraPalmKey } from './config';

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
		accounts: [devPrivateKey]
	},
	mainnet: {
		url: `https://eth-mainnet.alchemyapi.io/v2/${alchemyMainnetKey}`,
		accounts: [devPrivateKey],
		gasPrice: 200000000000
	},
	palm: {
		url: `https://palm-mainnet.infura.io/v3/${infuraPalmKey}`,
		accounts: [devPrivateKey]
	}
};
