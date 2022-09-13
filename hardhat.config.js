require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-docgen');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_RINKEBY_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_ROPSTEN_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      timeout: 600000,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_GOERLI_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      gasPrice: 2500000000,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      timeout: 60000,
      // gasPrice: 75000000000,
    },
    palm: {
      url: `https://palm-mainnet.infura.io/v3/${process.env.PALM_API_KEY}`,
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [`0x${process.env.DEV_PRIVATE_KEY}`],
      timeout: 600000,
    },
    frame: {
      url: "http://127.0.0.1:1248",
    },
    hardhat: {
      mining: {
        auto: true,
      },
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_MAINNET_API_KEY}`,
        blockNumber: 12772572,
      },
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  mocha: {
    timeout: 100000,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
};
