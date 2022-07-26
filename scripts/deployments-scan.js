const { ethers } = require('hardhat');
const https = require('https')

const fakeWalletAddress = '0x7346946C18B9C79DAE0520DDBC009D1EE816430B';

const multiProxyControllers = {
  'mainnet': '0x35fb4026dcF19f8cA37dcca4D2D68A549548750C',
  'rinkeby': '0xFc542C7fEA1da20E1195b2476ae35db50925515C',
  'arbitrum': '0x732E5F7FE7c40333DfeFF57755666F85d1e164c1',
}

const zaps = {
  'NFTXStakingZap': {
    'mainnet': '0x7a5e0B4069709cF4D02423b8cafDc608f4436791',
    'rinkeby': '0xeF5F5491EF04Df94638162Cb8f7CBAd64760e797',
    'arbitrum': '0xfb8664E4EB4d2F8B0220d358d0d9C4896DC84959',
  },
  'NFTXMarketplaceZap': {
    'mainnet': '0x0fc584529a2AEfA997697FAfAcbA5831faC0c22d',
    'rinkeby': '0xF83d27657a6474cB2Ae09a5b39177BBB80E63d81',
    'arbitrum': '0x66f26E38bD50FD52A50da8E87E435f04f98001B7',
  },
  'NFTXUnstakingInventoryZap': {
    'mainnet': '0x51d660Ba5c218b2Cf33FBAcA5e3aBb8aEff3543B',
    'rinkeby': '0x608F0D84657BB876DDEDD8d8d5aB9D12639d5798',
    'arbitrum': '0x009e4110Fd68c603DD1F9189C4BaC3D12Cde8c70',
  },
}

let providers, signers;


async function main() {

  providers = {
    'mainnet': new ethers.providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/i_qZ0g_j78x_hiP3rb8beh2nYWHWVel0'),
    'rinkeby': new ethers.providers.JsonRpcProvider('https://rinkeby.infura.io/v3/aaeff29653f045988e7c2bd8d4b04636'),
    'arbitrum': new ethers.providers.JsonRpcProvider('https://arb1.arbitrum.io/rpc'),
  }

  signers = {
    'mainnet': await providers['mainnet'].getSigner(fakeWalletAddress),
    'rinkeby': await providers['rinkeby'].getSigner(fakeWalletAddress),
    'arbitrum': await providers['arbitrum'].getSigner(fakeWalletAddress),
  }

  // console.log('-- Fetching our MultiProxy Controllers --');
  // console.log('');


  /**
   * GET OUR PROXY CONTRACT INFORMATION
   */

  const proxyMainnet = await ethers.getContractAt('MultiProxyController', multiProxyControllers['mainnet'], signers['mainnet']);
  const proxyRinkeby = await ethers.getContractAt('MultiProxyController', multiProxyControllers['rinkeby'], signers['rinkeby']);
  const proxyArbitrum = await ethers.getContractAt('MultiProxyController', multiProxyControllers['arbitrum'], signers['arbitrum']);

  console.log('');
  console.log('+-------------+------------------------------------------------+--------+-----------+');
  console.log('| Network     | Contract Address                               | Match  | Verified  |');
  console.log('+-------------+------------------------------------------------+--------+-----------+');

  let mainnetImplementations = await proxyMainnet.getAllImpls();
  let rinkebyImplementations = await proxyRinkeby.getAllImpls();
  let arbitrumImplementations = await proxyArbitrum.getAllImpls();

  for (let i = 0; i < mainnetImplementations.length; ++i) {
    await checkContractNetworks(
      await proxyMainnet.getName(i),
      mainnetImplementations[i],
      rinkebyImplementations[i],
      arbitrumImplementations[i]
    );
  }


  /**
   * GET OUR VAULT IMPLEMENTATION FROM THE VAULT FACTORY
   */

  let mainnetVaultFactory = await ethers.getContractAt('NFTXVaultFactoryUpgradeable', mainnetImplementations[0], signers['mainnet']);
  let rinkebyVaultFactory = await ethers.getContractAt('NFTXVaultFactoryUpgradeable', rinkebyImplementations[0], signers['rinkeby']);
  let arbitrumVaultFactory = await ethers.getContractAt('NFTXVaultFactoryUpgradeable', arbitrumImplementations[0], signers['arbitrum']);
 
  // Get the first vault on each of our vault factory implementations
  let mainnetVaultImplementation = await mainnetVaultFactory.vault('0');
  let rinkebyVaultImplementation = await rinkebyVaultFactory.vault('0');
  let arbitrumVaultImplementation = await arbitrumVaultFactory.vault('0');
 
  await checkContractNetworks(
    'NFTXVaultFactoryUpgradeable',
    mainnetVaultImplementation,
    rinkebyVaultImplementation,
    arbitrumVaultImplementation
  );


  /**
   * GET OUR TIMELOCK REWARD TOKEN FROM NFTX LP STAKING
   */

  let mainnetLPStaking = await ethers.getContractAt('NFTXLPStaking', mainnetImplementations[2], signers['mainnet']);
  let rinkebyLPStaking = await ethers.getContractAt('NFTXLPStaking', rinkebyImplementations[2], signers['rinkeby']);
  let arbitrumLPStaking = await ethers.getContractAt('NFTXLPStaking', arbitrumImplementations[2], signers['arbitrum']);

  // Get the first vault on each of our vault factory implementations
  let mainnetRewardDistToken = await mainnetLPStaking.newTimelockRewardDistTokenImpl();
  let rinkebyRewardDistToken = await rinkebyLPStaking.newTimelockRewardDistTokenImpl();
  let arbitrumRewardDistToken = await arbitrumLPStaking.newTimelockRewardDistTokenImpl();

  await checkContractNetworks(
    'TimelockRewardDistributionTokenImpl',
    mainnetRewardDistToken,
    rinkebyRewardDistToken,
    arbitrumRewardDistToken
  );


  /**
   * GET OUR XTOKEN FROM NFTX INVENTORY STAKING
   */

  let mainnetInventoryStaking = await ethers.getContractAt('NFTXInventoryStaking', mainnetImplementations[5], signers['mainnet']);
  let rinkebyInventoryStaking = await ethers.getContractAt('NFTXInventoryStaking', rinkebyImplementations[5], signers['rinkeby']);
  let arbitrumInventoryStaking = await ethers.getContractAt('NFTXInventoryStaking', arbitrumImplementations[5], signers['arbitrum']);

  // Get the first vault on each of our vault factory implementations
  let mainnetXToken = await mainnetInventoryStaking.childImplementation();
  let rinkebyXToken = await rinkebyInventoryStaking.childImplementation();
  let arbitrumXToken = await arbitrumInventoryStaking.childImplementation();

  await checkContractNetworks(
    'XTokenUpgradeable',
    mainnetXToken,
    rinkebyXToken,
    arbitrumXToken
  );


  /**
   * GET OUR ZAP CONTRACTS
   */

  let zapKeys = Object.keys(zaps);
  for (let i = 0; i < zapKeys.length; ++i) {
    let zapMainnet = await ethers.getContractAt(zapKeys[i], zaps[zapKeys[i]]['mainnet'], signers['mainnet']);
    let zapRinkeby = await ethers.getContractAt(zapKeys[i], zaps[zapKeys[i]]['rinkeby'], signers['rinkeby']);
    let zapArbitrum = await ethers.getContractAt(zapKeys[i], zaps[zapKeys[i]]['arbitrum'], signers['arbitrum']);

    await checkContractNetworks(
      zapKeys[i],
      zapMainnet.address,
      zapRinkeby.address,
      zapArbitrum.address
    );
  }
}


async function checkContractNetworks(name, mainnet, rinkeby, arbitrum) {
  let mainnetCode = await providers['mainnet'].getCode(mainnet);

  let isVerified = await checkContractValidated(mainnet, 'mainnet') ? 'true ' : 'false';
  let rinkebyVerified = await checkContractValidated(rinkeby, 'rinkeby') ? 'true ' : 'false';
  let arbitrumVerified = await checkContractValidated(arbitrum, 'arbitrum') ? 'true ' : 'false';

  let rinkebyMatches = await checkByteCodeMatches('rinkeby', rinkeby, mainnetCode) ? 'true ' : 'false';
  let arbitrumMatches = await checkByteCodeMatches('arbitrum', arbitrum, mainnetCode) ? 'true ' : 'false';

  console.log(`| ${name}                                                                           `);
  console.log('+-------------+------------------------------------------------+--------+-----------+');
  console.log(`| mainnet     | ${mainnet}     | ${isVerified}  | true      |`);
  console.log(`| rinkeby     | ${rinkeby}     | ${rinkebyVerified}  | ${rinkebyMatches}     |`);
  console.log(`| arbitrum    | ${arbitrum}     | ${arbitrumVerified}  | ${arbitrumMatches}     |`);
  console.log('+-----------------------------------------------------------------------------------+');
}


async function checkByteCodeMatches(network, address, baseByteCode) {
  let byteCode = await providers[network].getCode(address);
  return (byteCode == baseByteCode);
}


async function checkContractValidated(address, network) {
  uris = {
    'mainnet': 'https://api.etherscan.io',
    'rinkeby': 'https://api-rinkeby.etherscan.io',
    'arbitrum': 'https://api.arbiscan.io',
  }

  api_keys = {
    'mainnet': 'Q4A7CY29DUEGAAM419CXQ3ZBZUNJPH46ZC',
    'rinkeby': '',  // Authed API keys don't actually work on Rinkeby
    'arbitrum': 'ZFUE496DW5CMHK1KPT4M2V111J2YC99TJP',
  }

  return new Promise((resolve) => {
    https.get(`${uris[network]}/api?module=contract&action=getabi&address=${address}&apikey=${api_keys[network]}`, (res) => {
      var body = [];

      res.on('data', function(chunk) {
          body.push(chunk);
      });

      res.on('end', function() {
        try {
          body = JSON.parse(Buffer.concat(body).toString());
        } catch(e) {
          reject(e);
        }

        let result = !! (body.status == '1');

        resolve(result);
      });
    });
  });
}


main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
