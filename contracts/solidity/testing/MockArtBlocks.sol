// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


contract MockArtBlocks {

    uint public projectId;

    function setProjectId(uint _projectId) external {
        projectId = _projectId;
    }

    function tokenIdToProjectId(uint tokenId) external returns (uint) {
        return projectId;
    }

} 