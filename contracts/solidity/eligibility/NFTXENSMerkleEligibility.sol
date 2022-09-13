// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXMerkleEligibility.sol";


abstract contract ENS {
    function nameExpires(uint256 id) public virtual view returns (uint256);
}


/**
 * @title NFTX ENS Merkle Eligibility
 * @author Twade
 * 
 * @notice Allows vaults to be allow eligibility based ENS domains, allowing for minimum
 * expiration times to be set.
 */

contract NFTXENSMerkleEligibility is NFTXMerkleEligibility {

    /// @notice Minimum expiration time for ENS domains in seconds
    uint public minExpirationTime;


    /**
     * @notice The name of our Eligibility Module.
     *
     * @return string
     */

    function name() public pure override virtual returns (string memory) {    
        return 'ENSMerkleEligibility';
    }


    /**
     * @notice The address of our token asset contract.
     *
     * @return address 
     */

   function targetAsset() public pure override virtual returns (address) {
        return 0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85;
    }


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
            string memory _merkleLeavesURI,
            uint _minExpirationTime
        ) = abi.decode(configData, (bytes32, string, string, uint));

        __NFTXEligibility_init(_merkleRoot, _merkleReference, _merkleLeavesURI, _minExpirationTime);
    }


    /**
     * @notice Parameters here should mirror the config struct.
     * 
     * @param _merkleRoot The root of our merkle tree
     * @param _merkleReference Public name of the merkle eligibility implementation
     * @param _merkleLeavesURI API endpoint providing unencoded JSON array
     * @param _minExpirationTime Minimum number of seconds until ENS expiration
     */

    function __NFTXEligibility_init(
        bytes32 _merkleRoot,
        string memory _merkleReference,
        string memory _merkleLeavesURI,
        uint _minExpirationTime
    ) public initializer {
        super.__NFTXEligibility_init(_merkleRoot, _merkleReference, _merkleLeavesURI);

        minExpirationTime = _minExpirationTime;
    }


    /**
     * @notice Checks if a supplied token is eligible; in addition to our core merkle
     * eligibility checks we also need to confirm that the ENS domain won't expire within
     * a year.
     * 
     * @dev This check requires the token to have already been passed to `processToken`.
     *
     * @return bool If the tokenId is eligible
     */

    function _checkIfEligible(uint tokenId) internal view override virtual returns (bool) {
    	// Get the expiry time of the token ID provided and ensure it has at least
    	// 365 days left until it expires.
    	if (block.timestamp + minExpirationTime > ENS(targetAsset()).nameExpires(tokenId)) {
    		return false;
    	}

    	return super._checkIfEligible(tokenId);
    }

}
