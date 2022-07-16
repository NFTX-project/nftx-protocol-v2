// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXEligibility.sol";

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@chainlink/contracts/src/v0.8/ConfirmedOwner.sol';


/**
 * @title Partial interface for the ArtBlocks contract.
 */

interface ArtBlocks {
    function tokenIdToProjectId(uint tokenId) external view returns (uint projectId);
}


/**
 * @title NFTX Art Blocks Curated Eligibility
 * @author Twade
 * 
 * @notice Allows for an NFTX vault to only access `curated` ArtBlocks project tokens.
 */

abstract contract NFTXArtBlocksCuratedEligibility is NFTXEligibility, ChainlinkClient, ConfirmedOwner {

    using Chainlink for Chainlink.Request;

    /// @notice Emitted when our NFTX Eligibility is deployed
    event NFTXEligibilityInit();

    /// @notice Emitted when a project validity check is started
    event PrecursoryCheckStarted(uint projectId, bytes32 jobId);

    /// @notice Emitted when a project validity check has been completed
    event PrecursoryCheckComplete(uint projectId, bytes32 jobId, bool isValid);

    /// @notice Stores a mapping of ArtBlock project eligibility
    /// @dev 0 === unset, 1 === True, 2 === False
    mapping (uint => uint8) public projectEligibility;

    /// @notice Stores a mapping of token
    mapping (uint => uint) public tokenProjects;

    /// @notice Store the project ID against pending requests
    mapping (bytes32 => uint) public requestProjectId;

    /// @notice Store the ChainLink job ID that we will be using
    bytes32 private jobId;

    /// @notice Store the fee that will be taken for ChainLink transactions
    uint256 private fee;


    /**
     * @notice The name of our Eligibility Module.
     *
     * @return string
     */

    function name() public pure override virtual returns (string memory) {    
        return "CuratedArtBlocks";
    }


    /**
     * @notice Confirms that our module has been finalised and won't change.
     *
     * @return bool
     */

    function finalized() public view override virtual returns (bool) {    
        return true;
    }


    /**
     * @notice References the second ArtBlocks contract that all tokens must be
     * generated from.
     * 
     * @dev Different projects will be assigned to this contract, meaning that
     * we need additional logic to determine the project's curation status as we
     * only want "curated" project tokens to be eligible.
     *
     * @return address 
     */

   function targetAsset() public pure override virtual returns (address) {
        return 0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270;
    }


    /**
     * @notice Sets up our ChainLink integration variables when the contract is
     * called.
     */

    constructor() ConfirmedOwner(msg.sender) {
        // Set up our ChainLink references to allow our job to run against
        // a specified oracle job.
        setChainlinkToken(0x01BE23585060835E02B77ef475b0Cc51aA1e0709);
        setChainlinkOracle(0xf3FBB7f3391F62C8fe53f89B41dFC8159EE9653f);
        jobId = '7d80a6386ef543a3abb52817f6707e3b';

        // Set our fee to 0.1 * 10**18 (Varies by network and job)
        fee = (1 * LINK_DIVISIBILITY) / 10;
    }

    /**
     * @notice Allow our eligibility module to be initialised with optional
     * config data.
     * 
     * @dev As there is no logic required in the init, we just directly
     * call `__NFTXEligibility_init`.
     */

    function __NFTXEligibility_init_bytes(bytes memory /* configData */) public override virtual initializer {
        __NFTXEligibility_init();
    }


    /**
     * @notice Parameters here should mirror the config struct.
     */

    function __NFTXEligibility_init() public initializer {
        emit NFTXEligibilityInit();
    }


    /**
     * @notice Checks if a supplied token is eligible, which is defined by being
     * part of a "curated" ArtBlocks project.
     *
     * @return bool If the tokenId is eligible
     */

    function _checkIfEligible(uint tokenId) internal view override virtual returns (bool) {
        // If we have a `projectEligibility` value already stored, then we can return
        // an eligibility boolean based on the integer value assigned.
        return projectEligibility[tokenProjects[tokenId]] == 1;
    }


    /**
     * @notice Allows the contract owner to set the eligibility of projects in bulk.
     * 
     * @dev This is intended to be used as an initial content population strategy that
     * will reduce the amount of required gas. This should not be called after the initial
     * deployment of the module.
     * 
     * @param projectIds An array of project IDs
     * @param values The corresponding eligibility values for each project ID
     */

    function setProjectEligibility(uint[] calldata projectIds, uint8[] calldata values) external onlyOwner {
        uint length = index.length;
        require(length > 0);

        for (uint i; i < length;) {
            // Prevent a project that already has an eligibility boolean from being
            // updated or overwritten.
            if (projectEligibility[index[i]] != 0) {
                projectEligibility[index[i]] = value[i];
            }

            unchecked { ++i; }
        }
    }


    /**
     * @notice Checks if the token requires a precursory validation before it can have
     * it's eligibility determined.
     * 
     * @dev If this returns `true`, `runPrecursoryValidation` should subsequently be run
     * before checking the eligibility of the token.
     * 
     * @param tokenId The ArtBlocks token ID
     *
     * @return bool If the tokenId requires precursory validation
     */

    function requiresPrecursoryValidation(uint tokenId) public view returns (bool) {
        // If our value is not yet mapped, then we require a precursory validation
        // to be performed.
        return projectEligibility[tokenProjects[tokenId]] == 0;
    }


    /**
     * @notice This will run a precursory check by checking the ArtBlocks token metadata
     * via a direct API call. This uses ChainLink to ensure the data is stored on chain
     * and will be confirmed in a subsequent callback.
     * 
     * @dev This call will require the contract to hold a sufficient $LINK balance. This
     * will cost approximately 0.1 LINK per call and will fail if it is not properly
     * funded.
     * 
     * When the precursory check is completed, a subsequent event will be fired that
     * will allow a frontend client to confirm it has been completed.
     * 
     * @param tokenId The ArtBlocks token ID being validated
     *
     * @return bytes32 The request ID of the ChainLink job being processed
     */

    function runPrecursoryValidation(uint tokenId) public returns (bytes32) {
        // Set up our chainlink job
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // Hit the artblocks API endpoint, looking for the curation status
        req.add('get', string(abi.encodePacked('https://token.artblocks.io/', tokenId)));
        req.add('path', 'curation_status');

        // Fire our chainlink request, returning a requestId that we will track
        bytes32 requestId = sendChainlinkRequest(req, fee);

        // Get our project ID, attaching it to our request, saving us a subsequent API
        // call to additionall get that information as it's available onchain.
        uint projectId = _tokenIdToProjectId(tokenId);
        requestProjectId[requestId] = projectId;

        // Let our stalkers know that we are making the request
        emit PrecursoryCheckStarted(projectId, requestId);
        return requestId;
    }


    /**
     * @notice Upon successful processing of the ChainLink job we will receive
     * a callback to this function, allowing us to update our project eligibility
     * based on the response.
     * 
     * @param requestId The ChainLink request ID
     * @param bytesData The `curation_status` of our requested token's project
     */

    function fulfill(bytes32 requestId, bytes memory bytesData) public recordChainlinkFulfillment(requestId) {
        // Check if we have a valid, curated project response
        bool isValid = keccak256(bytesData) == keccak256(bytes('curated'));

        // Map our project eligibility based on our response
        projectEligibility[requestProjectId[requestId]] = isValid ? 1 : 2;

        // Remove our existing job mapping to remove some overhead
        delete requestProjectId[requestId];

        // Let anyone listening know that the job is complete and the result of
        // the project's validity.
        emit PrecursoryCheckComplete(requestProjectId[requestId], requestId, isValid);
    }


    /**
     * @notice Allows for a cached conversion of an ArtBlocks token ID to it's project
     * ID. If we don't have a stored project ID for the token, then the ArtBlocks contract
     * is queried to handle the conversion; this value is then cached for future calls.
     *
     * @return uint The project ID belonging to the token ID
     */

    function _tokenIdToProjectId(uint _tokenId) public returns (uint) {
        // Check if we already have a mapped project for the token
        if (tokenProjects[_tokenId] != 0) {
            return tokenProjects[_tokenId];
        }

        // Make an onchain request to the ArtBlocks contract to get the project
        // ID belonging to the token ID. We then map the data to optimise future
        // calls.
        tokenProjects[_tokenId] = ArtBlocks(targetAsset()).tokenIdToProjectId(_tokenId);
        return tokenProjects[_tokenId];
    }


    /**
     * @notice Allow withdraw of Link tokens from the contract
     */

    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), 'Unable to transfer');
    }

}
