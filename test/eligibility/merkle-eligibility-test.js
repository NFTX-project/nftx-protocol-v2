const { expect } = require('chai');
const { ethers, upgrades } = require('hardhat');

const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')


// Store our deployer and a range of test users
let deployer, alice, bob, carol, users;


describe('NFTXENSMerkleEligibility', function () {

  before('Setup', async () => {
    // Set up our users
    [deployer, alice, bob, carol, ...users] = await ethers.getSigners();
  });

  describe('Basic merkle JS library test', function () {

    it('Should detect good leaf', async () => {
      const leaves = ['pikachu', 'charmander', 'squirtle'].map(x => keccak256(getTokenId(x)));

      const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      const root = tree.getHexRoot();

      const leaf = keccak256(getTokenId('pikachu'));
      const proof = tree.getHexProof(leaf);
      
      expect(tree.verify(proof, leaf, root)).to.equal(true);
    });

    it('Should detect bad leaf', async () => {
      const leaves = ['pikachu', 'charmander', 'squirtle'].map(x => keccak256(getTokenId(x)));

      const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      const root = tree.getHexRoot();

      const badLeaf = keccak256(getTokenId('typhlosion'));
      const badProof = tree.getHexProof(badLeaf);

      expect(tree.verify(badProof, badLeaf, root)).to.equal(false);
    });
  });

  describe('Arbritrary data', function () {
    let eligibility;
    let tree, merkleRoot;

    before('Setup', async () => {
      // Set up our Merkle tree leaves
      const leaves = [
        keccak256(getTokenId('a')),
        keccak256(getTokenId('b')),
        keccak256(getTokenId('c')),
      ];

      // Create a merkle tree from it
      tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      merkleRoot = tree.getHexRoot();

      // Deploy our eligibility module
      const MockNFTXENSMerkleEligibility = await ethers.getContractFactory('MockNFTXENSMerkleEligibility');
      eligibility = await MockNFTXENSMerkleEligibility.deploy();
      await eligibility.deployed();

      // Set up our eligibility contract with our merkle root
      await eligibility.__NFTXEligibility_init_bytes(
        ethers.utils.defaultAbiCoder.encode(['bytes32', 'string', 'string', 'uint'], [merkleRoot, 'Merkle__Arbritrary', '', 0])
      );

      // Confirm our merkle root is set
      expect(await eligibility.merkleRoot()).to.equal(merkleRoot);
    });

    it('Should be able to detect valid name', async () => {
      // Get our leaf
      const tokenId = getTokenId('a');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that our local library would allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(true);

      // Process our token and confirm that it has been marked as valid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(true);
    });

    it('Should be able to detect invalid name', async () => {
      // Get our leaf
      const tokenId = getTokenId('d');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that our local library would allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(false);

      // Process our token and confirm that it has been marked as valid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(false);
    });

    it('Should be able to check eligibility', async () => {
      // Valid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('a'))).to.equal(true);

      // Invalid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('d'))).to.equal(false);

      // Valid, but unprocessed token
      expect(await eligibility.checkIsEligible(getTokenId('b'))).to.equal(false);
    });

    it('Should be able to process multiple eligibilities', async () => {
      // Get an array of token IDs to test
      const tokenIds = [
        getTokenId('a'),  // This will have already been checked
        getTokenId('b'),  // This will be checked
        getTokenId('e'),  // This will fail it's check
      ];

      // Calculate our tree's proof from tokenHashes
      // for each corresponding ID.
      const proofs = [
        tree.getHexProof(keccak256(getTokenId('a'))),
        tree.getHexProof(keccak256(getTokenId('b'))),
        tree.getHexProof(keccak256(getTokenId('e'))),
      ];

      // Process our token and confirm that it has been marked as valid
      await eligibility.processTokens(tokenIds, proofs);

      expect(await eligibility.validTokenHashes(keccak256(getTokenId('a')))).to.equal(true);
      expect(await eligibility.validTokenHashes(keccak256(getTokenId('b')))).to.equal(true);
      expect(await eligibility.validTokenHashes(keccak256(getTokenId('e')))).to.equal(false);
    });

    it('Should allow multiple processing attempts', async () => {
      const proofA = tree.getHexProof(keccak256(getTokenId('a')));
      const proofB = tree.getHexProof(keccak256(getTokenId('b')));

      expect(await eligibility.requiresProcessing(getTokenId('a'), proofA)).to.equal(false);
      expect(await eligibility.requiresProcessing(getTokenId('a'), proofB)).to.equal(true);
      expect(await eligibility.requiresProcessing(getTokenId('b'), proofA)).to.equal(true);
      expect(await eligibility.requiresProcessing(getTokenId('b'), proofB)).to.equal(false);
    });

  });

  describe('Pokemon Gen 1', function () {
    let eligibility;
    let tree, merkleRoot;

    before('Setup', async () => {
      // Set up our Merkle tree
      const leaves = genOnePokemonList().map(x => keccak256(getTokenId(x)));

      tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      merkleRoot = tree.getHexRoot();

      // Deploy our eligibility module
      const MockNFTXENSMerkleEligibility = await ethers.getContractFactory('MockNFTXENSMerkleEligibility');
      eligibility = await MockNFTXENSMerkleEligibility.deploy();
      await eligibility.deployed();

      // Set up our eligibility contract with our merkle root
      await eligibility.__NFTXEligibility_init_bytes(
        ethers.utils.defaultAbiCoder.encode(['bytes32', 'string', 'string', 'uint'], [merkleRoot, 'Merkle__Pokemon', '', 0])
      );

      // Confirm our merkle root is set
      expect(await eligibility.merkleRoot()).to.equal(merkleRoot);
    });

    it('Should be able to detect valid name', async () => {
      const tokenId = getTokenId('pikachu');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(true);

      // Process our token and confirm that it has been marked as valid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(true);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to detect invalid name', async () => {
      const tokenId = getTokenId('typhlosion');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would not allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(false);

      // Process our token and confirm that it has been marked as invalid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(false);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to check eligibility', async () => {
      // Valid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('pikachu'))).to.equal(true);

      // Invalid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('typhlosion'))).to.equal(false);

      // Valid, but unprocessed token
      expect(await eligibility.checkIsEligible(getTokenId('squirtle'))).to.equal(false);
    });

  });

  describe('NNNN', function () {

    let eligibility;
    let tree, merkleRoot;

    before('Setup', async () => {
      // Set up our Merkle tree
      const leaves = fourDigitNumbersList().map(x => keccak256(getTokenId(x)));

      tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      merkleRoot = tree.getHexRoot();

      // Deploy our eligibility module
      const MockNFTXENSMerkleEligibility = await ethers.getContractFactory('MockNFTXENSMerkleEligibility');
      eligibility = await MockNFTXENSMerkleEligibility.deploy();
      await eligibility.deployed();

      // Set up our eligibility contract with our merkle root
      await eligibility.__NFTXEligibility_init_bytes(
        ethers.utils.defaultAbiCoder.encode(['bytes32', 'string', 'string', 'uint'], [merkleRoot, 'Merkle__NNNN', '', 0])
      );

      // Confirm our merkle root is set
      expect(await eligibility.merkleRoot()).to.equal(merkleRoot);
    });

    it('Should be able to detect valid name', async () => {
      const tokenId = getTokenId('1234');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(true);

      // Process our token and confirm that it has been marked as valid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(true);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to detect invalid name', async () => {
      const tokenId = getTokenId('99999');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would not allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(false);

      // Process our token and confirm that it has been marked as invalid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(false);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to check eligibility', async () => {
      // Valid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('1234'))).to.equal(true);

      // Invalid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('99999'))).to.equal(false);

      // Valid, but unprocessed token
      expect(await eligibility.checkIsEligible(getTokenId('4321'))).to.equal(false);
    });

  });

  describe('LLL', function () {

    let eligibility;
    let tree, merkleRoot;

    before('Setup', async () => {
      // Set up our Merkle tree
      const leaves = threeLetterList().map(x => keccak256(getTokenId(x)));

      tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
      merkleRoot = tree.getHexRoot();

      // Deploy our eligibility module
      const MockNFTXENSMerkleEligibility = await ethers.getContractFactory('MockNFTXENSMerkleEligibility');
      eligibility = await MockNFTXENSMerkleEligibility.deploy();
      await eligibility.deployed();

      // Set up our eligibility contract with our merkle root
      await eligibility.__NFTXEligibility_init_bytes(
        ethers.utils.defaultAbiCoder.encode(['bytes32', 'string', 'string', 'uint'], [merkleRoot, 'Merkle__LLL', '', 0])
      );

      // Confirm our merkle root is set
      expect(await eligibility.merkleRoot()).to.equal(merkleRoot);
    });

    it('Should be able to detect valid name', async () => {
      const tokenId = getTokenId('abc');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(true);

      // Process our token and confirm that it has been marked as valid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(true);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to detect invalid name', async () => {
      const tokenId = getTokenId('xy9');
      const tokenHash = keccak256(tokenId);

      // Calculate our tree's proof from our tokenHash
      const proof = tree.getHexProof(tokenHash);

      // Confirm that prior to processing, we correctly require it to be processed
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(true);

      // Confirm that our local library would not allow this
      expect(tree.verify(proof, tokenHash, merkleRoot)).to.equal(false);

      // Process our token and confirm that it has been marked as invalid
      await eligibility.processToken(tokenId, proof);
      expect(await eligibility.validTokenHashes(tokenHash)).to.equal(false);

      // Confirm that it no longer requires processing
      expect(await eligibility.requiresProcessing(tokenId, proof)).to.equal(false);
    });

    it('Should be able to check eligibility', async () => {
      // Valid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('abc'))).to.equal(true);

      // Invalid token that has been processed
      expect(await eligibility.checkIsEligible(getTokenId('xy9'))).to.equal(false);

      // Valid, but unprocessed token
      expect(await eligibility.checkIsEligible(getTokenId('xyz'))).to.equal(false);
    });

  });

});


function getTokenId(domain) {
  return ethers.BigNumber.from(ethers.utils.id(domain.toLowerCase())).toString();
}

function fourDigitNumbersList() {
  let options = [];
  for (let i = 0; i < 10000; ++i) {
    options.push(`${i}`.padStart(4, '0'));
  }
  return options;
}

function threeLetterList() {
  const alpha = Array.from(Array(26)).map((e, i) => i + 65);
  const alphabet = alpha.map((x) => String.fromCharCode(x));

  let options = [];
  for (let a = 0; a < 26; ++a) {
    for (let b = 0; b < 26; ++b) {
      for (let c = 0; c < 26; ++c) {
        options.push(`${alphabet[a]}${alphabet[b]}${alphabet[c]}`);
      }
    }
  }

  return options;
}


function genOnePokemonList() {
  return [
    'bulbasaur',
    'ivysaur',
    'venusaur',
    'charmander',
    'charmeleon',
    'charizard',
    'squirtle',
    'wartortle',
    'blastoise',
    'caterpie',
    'metapod',
    'butterfree',
    'weedle',
    'kakuna',
    'beedrill',
    'pidgey',
    'pidgeotto',
    'pidgeot',
    'rattata',
    'raticate',
    'spearow',
    'fearow',
    'ekans',
    'arbok',
    'pikachu',
    'raichu',
    'sandshrew',
    'sandslash',
    'nidoran',
    'nidorina',
    'nidoqueen',
    'nidorino',
    'nidoking',
    'clefairy',
    'clefable',
    'vulpix',
    'ninetales',
    'jigglypuff',
    'wigglytuff',
    'zubat',
    'golbat',
    'oddish',
    'gloom',
    'vileplume',
    'paras',
    'parasect',
    'venonat',
    'venomoth',
    'diglett',
    'dugtrio',
    'meowth',
    'persian',
    'psyduck',
    'golduck',
    'mankey',
    'primeape',
    'growlithe',
    'arcanine',
    'poliwag',
    'poliwhirl',
    'poliwrath',
    'abra',
    'kadabra',
    'alakazam',
    'machop',
    'machoke',
    'machamp',
    'bellsprout',
    'weepinbell',
    'victreebel',
    'tentacool',
    'tentacruel',
    'geodude',
    'graveler',
    'golem',
    'ponyta',
    'rapidash',
    'slowpoke',
    'slowbro',
    'magnemite',
    'magneton',
    'farfetchd',
    'doduo',
    'dodrio',
    'seel',
    'dewgong',
    'grimer',
    'muk',
    'shellder',
    'cloyster',
    'gastly',
    'haunter',
    'gengar',
    'onix',
    'drowzee',
    'hypno',
    'krabby',
    'kingler',
    'voltorb',
    'electrode',
    'exeggcute',
    'exeggutor',
    'cubone',
    'marowak',
    'hitmonlee',
    'hitmonchan',
    'lickitung',
    'koffing',
    'weezing',
    'rhyhorn',
    'rhydon',
    'chansey',
    'tangela',
    'kangaskhan',
    'horsea',
    'seadra',
    'goldeen',
    'seaking',
    'staryu',
    'starmie',
    'mrmime',
    'scyther',
    'jynx',
    'electabuzz',
    'magmar',
    'pinsir',
    'tauros',
    'magikarp',
    'gyarados',
    'lapras',
    'ditto',
    'eevee',
    'vaporeon',
    'jolteon',
    'flareon',
    'porygon',
    'omanyte',
    'omastar',
    'kabuto',
    'kabutops',
    'aerodactyl',
    'snorlax',
    'articuno',
    'zapdos',
    'moltres',
    'dratini',
    'dragonair',
    'dragonite',
    'mewtwo',
    'mew',
  ]
}

