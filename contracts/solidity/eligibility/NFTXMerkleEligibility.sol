// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXEligibility.sol";


library Strings {
    /**
     * @dev Converts a `uint256` to its ASCII `string` decimal representation.
     */
    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}


/**
 * @dev These functions deal with verification of Merkle Tree proofs.
 *
 * The proofs can be generated using the JavaScript library
 * https://github.com/miguelmota/merkletreejs[merkletreejs].
 * Note: the hashing algorithm should be keccak256 and pair sorting should be enabled.
 *
 * See `test/utils/cryptography/MerkleProof.test.js` for some examples.
 *
 * WARNING: You should avoid using leaf values that are 64 bytes long prior to
 * hashing, or use a hash function other than keccak256 for hashing leaves.
 * This is because the concatenation of a sorted pair of internal nodes in
 * the merkle tree could be reinterpreted as a leaf value.
 */

library MerkleProof {
    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree. Each
     * pair of leaves and each pair of pre-images are assumed to be sorted.
     */
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        return processProof(proof, leaf) == root;
    }

    /**
     * @dev Returns the rebuilt hash obtained by traversing a Merkle tree up
     * from `leaf` using `proof`. A `proof` is valid if and only if the rebuilt
     * hash matches the root of the tree. When processing the proof, the pairs
     * of leafs & pre-images are assumed to be sorted.
     *
     * _Available since v4.4._
     */
    function processProof(bytes32[] memory proof, bytes32 leaf) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return a < b ? _efficientHash(a, b) : _efficientHash(b, a);
    }

    function _efficientHash(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        /// @solidity memory-safe-assembly
        assembly {
            mstore(0x00, a)
            mstore(0x20, b)
            value := keccak256(0x00, 0x40)
        }
    }
}


/**
 * @title NFTX Merkle Eligibility
 * @author Twade
 * 
 * @notice Allows vaults to be allow eligibility based on a predefined merkle tree.
 */

abstract contract NFTXMerkleEligibility is NFTXEligibility {

    /// @notice Emitted when our NFTX Eligibility is deployed
    event NFTXEligibilityInit(bytes32 merkleRoot);

    /// @notice Emitted when a project validity check is started
    event PrecursoryCheckStarted(uint tokenId, bytes32 requestId);

    /// @notice Emitted when a project validity check has been completed
    event PrecursoryCheckComplete(uint tokenId, bytes32 requestId, bool isValid);

    /// @notice Set our asset contract address
    mapping(bytes32 => bool) public validTokenHashes;
    mapping(bytes32 => bool) private _processedTokenHashes;

    /// @notice Merkle proof to validate all eligible domains against
    bytes32 public merkleRoot;


    /**
     * @notice The name of our Eligibility Module.
     *
     * @return string
     */

    function name() public pure override virtual returns (string memory) {}


    /**
     * @notice Confirms that our module has been finalised and won't change.
     *
     * @return bool
     */

    function finalized() public view override virtual returns (bool) {    
        return true;
    }


    /**
     * @notice The address of our token asset contract.
     *
     * @return address 
     */

   function targetAsset() public pure override virtual returns (address) {}


    /**
     * @notice Allow our eligibility module to be initialised with optional
     * config data.
     * 
     * @param configData Encoded config data
     */

    function __NFTXEligibility_init_bytes(bytes memory configData) public override virtual initializer {
        (bytes32 _merkleRoot) = abi.decode(configData, (bytes32));
        __NFTXEligibility_init(_merkleRoot);
    }


    /**
     * @notice Parameters here should mirror the config struct.
     * 
     * @param _merkleRoot The root of our merkle tree
     */

    function __NFTXEligibility_init(bytes32 _merkleRoot) public initializer {
        merkleRoot = _merkleRoot;
        emit NFTXEligibilityInit(_merkleRoot);
    }


    /**
     * @notice Checks if a supplied token is eligible, which is defined by our merkle
     * tree root assigned at initialisation.
     * 
     * @dev This check requires the token to have already been passed to `processToken`.
     *
     * @return bool If the tokenId is eligible
     */

    function _checkIfEligible(uint tokenId) internal view override virtual returns (bool) {
        return validTokenHashes[keccak256(bytes(Strings.toString(tokenId)))];
    }

    /**
     * @notice Checks if the token requires a precursory validation before it can have
     * it's eligibility determined.
     * 
     * @dev If this returns `true`, `processToken` should subsequently be run before
     * checking the eligibility of the token.
     * 
     * @param tokenId The ENS domain token ID
     *
     * @return bool If the tokenId requires precursory validation
     */

    function requiresProcessing(uint tokenId) public view returns (bool) {
        return !_processedTokenHashes[keccak256(bytes(Strings.toString(tokenId)))];
    }


    /**
     * @notice This will run a precursory check by encoding the token ID, creating the
     * token hash, and then checking this against our merkle tree.
     *
     * @param tokenId The ENS token ID being validated
     * @param merkleProof Merkle proof to validate against the tokenId
     *
     * @return bool If the token is valid
     */

    function processToken(uint tokenId, bytes32[] calldata merkleProof) public returns (bool) {
        // If the token has already been processed, just return the validity
        if (!requiresProcessing(tokenId)) {
            return _checkIfEligible(tokenId);
        }

    	// Get the hashed equivalent of our tokenId
    	bytes32 tokenHash = keccak256(bytes(Strings.toString(tokenId)));

    	// Determine if our domain is eligible by traversing our merkle tree
    	bool isValid = MerkleProof.verify(merkleProof, merkleRoot, tokenHash);

        // Mark our hash as processed
        validTokenHashes[tokenHash] = isValid;
        _processedTokenHashes[tokenHash] = true;

        // Let our stalkers know that we are making the request
        emit PrecursoryCheckStarted(tokenId, tokenHash);
        emit PrecursoryCheckComplete(tokenId, tokenHash, isValid);

        return isValid;
    }


    /**
     * @notice This will run a number of precursory checks by encoding the token ID,
     * creating the token hash, and then checking this against our merkle tree.
     *
     * @param tokenIds The ENS token ID being validated
     * @param merkleProofs Merkle proof to validate against the tokenId
     *
     * @return bool[] If the token at the corresponding index is valid
     */

    function processTokens(uint[] calldata tokenIds, bytes32[][] calldata merkleProofs) public returns (bool[] memory) {
        // Iterate over our process tokens
        uint numberOfTokens = tokenIds.length;
        bool[] memory isValid = new bool[](numberOfTokens);

        // Loop through and process our tokens
        for (uint i; i < numberOfTokens;) {
            isValid[i] = processToken(tokenIds[i], merkleProofs[i]);
            unchecked { ++i; }
        }

        return isValid;
    }

}
