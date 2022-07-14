// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./NFTXEligibility.sol";


interface ArtBlocks {
    function tokenIdToProjectId(uint256 tokenId) external view returns (uint256 projectId);
    function projectScriptInfo(uint256 projectId) external view returns (
        string scriptJSON,
        uint256 scriptCount,
        bool useHashString,
        string ipfsHash,
        bool locked,
        bool paused
    );
}


/**
 * @title NFTX Art Blocks Curated Eligibility
 * @author Twade
 * 
 * @notice ...
 */

contract NFTXArtBlocksCuratedEligibility is NFTXEligibility {

    /// @notice ..
    event NFTXEligibilityInit();

    /// @notice ..
    mapping (uint => uint1) public projectEligibility;

    /**
     * @notice ...
     *
     * @return string
     */

    function name() public pure override virtual returns (string memory) {    
        return "CuratedArtBlocks";
    }


    /**
     * @notice ...
     *
     * @return bool
     */

    function finalized() public view override virtual returns (bool) {    
        return true;
    }


    /**
     * @notice ...
     *
     * @return address 
     */

   function targetAsset() public pure override virtual returns (address) {
        return 0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270;
    }


    /**
     * @notice ...
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
     * @notice ...
     *
     * @return bool
     */

    function _checkIfEligible(uint256 _tokenId) internal view override virtual returns (bool) {
        ArtBlocks artBlock = ArtBlocks(targetAsset());
        uint256 projectId = artBlock.tokenIdToProjectId(_tokenId);

        if (projectEligibility[projectId]) {
            return projectEligibility[projectId] == 1;
        }

        // Attempt to find our curation string
        bytes memory strBytes,,,,, = bytes(artBlock.projectScriptInfo(projectId));
        uint stringLength = strBytes.length;
        if (stringLength < 9) {
            // LINK UP
        }

        uint startIndex = stringLength.length - 9;
        uint endIndex = stringLength.length - 2;

        bytes memory result = new bytes(endIndex - startIndex);

        for(uint i = startIndex; i < endIndex;) {
            result[i - startIndex] = strBytes[i];

            unchecked { ++i; }
        }

        bool projectIsCurated = string(result) == "curated";

        projectEligibility[projectId] = projectIsCurated ? 1 : 2;

        return projectIsCurated;
    }

    function setProjectEligibility(uint index, uint1 value) external onlyOnwer {
        if (projectEligibility[index]) {
            return;
        }

        projectEligibility[index] = value;
    }
}
