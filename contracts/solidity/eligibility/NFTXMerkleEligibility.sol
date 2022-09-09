// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXEligibility.sol";


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
        bytes32 computedHash = leaf;
        for (uint i = 0; i < proof.length;) {
            computedHash = _hashPair(computedHash, proof[i]);
            unchecked { i++; }
        }
        return computedHash == root;
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
    event NFTXEligibilityInit(bytes32 merkleRoot, string _merkleReference, string _merkleLeavesURI);

    /// @notice Emitted when a project validity check is started
    event PrecursoryCheckStarted(uint tokenId, bytes32 requestId);

    /// @notice Emitted when a project validity check has been completed
    event PrecursoryCheckComplete(uint tokenId, bytes32 requestId, bool isValid);

    /// @notice Internal storage of valid and processed tokens
    mapping(bytes32 => bool) public validTokenHashes;
    mapping(bytes32 => mapping(bytes32 => bool)) private _processedTokenHashes;

    /// @notice Merkle proof to validate all eligible domains against
    bytes32 public merkleRoot;

    /// @notice Merkle reference for any required frontend differentiation
    string public merkleReference;

    /// @notice URI to JSON list of unencoded token IDs
    string public merkleLeavesURI;


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
        (
            bytes32 _merkleRoot,
            string memory _merkleReference,
            string memory _merkleLeavesURI
        ) = abi.decode(configData, (bytes32, string, string));

        __NFTXEligibility_init(_merkleRoot, _merkleReference, _merkleLeavesURI);
    }


    /**
     * @notice Parameters here should mirror the config struct.
     * 
     * @param _merkleRoot The root of our merkle tree
     */

    function __NFTXEligibility_init(bytes32 _merkleRoot, string memory _merkleReference, string memory _merkleLeavesURI) public initializer {
        merkleRoot = _merkleRoot;
        merkleReference = _merkleReference;
        merkleLeavesURI = _merkleLeavesURI;

        emit NFTXEligibilityInit(_merkleRoot, _merkleReference, _merkleLeavesURI);
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
        return validTokenHashes[_hashTokenId(tokenId)];
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

    function requiresProcessing(uint tokenId, bytes32[] calldata merkleProof) public view returns (bool) {
        // Check if we have a confirmed processing log
        return !_processedTokenHashes[_hashTokenId(tokenId)][_hashMerkleProof(merkleProof)];
    }


    /**
     * @notice This will run a number of precursory checks by encoding the token ID,
     * creating the token hash, and then checking this against our merkle tree.
     *
     * @param tokenIds The ENS token IDs being validated
     * @param merkleProofs Merkle proofs to validate against the corresponding tokenId
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


    /**
     * @notice This will run a precursory check by encoding the token ID, creating the
     * token hash, and then checking this against our merkle tree.
     *
     * @param tokenId The ENS token ID being validated
     * @param merkleProof Merkle proof to validate against the tokenId
     *
     * @return isValid If the token is valid
     */

    function processToken(uint tokenId, bytes32[] calldata merkleProof) public returns (bool isValid) {
        // If the token has already been processed, just return the validity
        if (!requiresProcessing(tokenId, merkleProof)) {
            return _checkIfEligible(tokenId);
        }

    	// Get the hashed equivalent of our tokenId
    	bytes32 tokenHash = _hashTokenId(tokenId);

    	// Determine if our domain is eligible by traversing our merkle tree
    	isValid = MerkleProof.verify(merkleProof, merkleRoot, tokenHash);

        // Update our token eligibility _only_ if we have been able to confirm that
        // it is eligible. This prevents incorrect proofs from bricking a token.
        if (isValid) {
            validTokenHashes[tokenHash] = isValid;
        }

        // Confirm that this has been processed
        _processedTokenHashes[tokenHash][_hashMerkleProof(merkleProof)] = true;
    }


    /**
     * @notice Hashes the token ID to convert it into the token hash.
     *
     * @param tokenId The ENS token ID being hashed
     *
     * @return bytes32 The encrypted token hash
     */

    function _hashTokenId(uint tokenId) private pure returns (bytes32) {
        return keccak256(_tokenString(tokenId));
    }


    /**
     * @notice This will convert a 2d bytes32 array into a bytes32 hash.
     *
     * @param merkleProofs Merkle proof to encrypted
     *
     * @return bytes32 The hashed merkle proof
     */

    function _hashMerkleProof(bytes32[] memory merkleProofs) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(merkleProofs));
    }


    /**
     * @notice Converts a `uint256` to its ASCII `string` decimal representation.
     * 
     * @param value Integer value
     * 
     * @return string String of the integer value
     */

    function _tokenString(uint256 value) internal pure returns (bytes memory) {
        if (value == 0) {
            return "0";
        }

        uint256 temp = value;
        uint256 digits;

        while (temp != 0) {
            unchecked { ++digits; }
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);

        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }

        return buffer;
    }

}
