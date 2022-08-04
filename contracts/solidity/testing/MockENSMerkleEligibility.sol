// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../eligibility/NFTXMerkleEligibility.sol";


contract MockNFTXENSMerkleEligibility is NFTXMerkleEligibility {

    /// @notice Minimum expiration time of domain
    uint minExpirationTime;


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
     * @notice Sets the minimum expiration time for ENS domains the vault.
     *
     * @param _minExpirationTime Minimum expiration time in seconds
     */

    constructor(uint _minExpirationTime) {
        minExpirationTime = _minExpirationTime;
    }

}
