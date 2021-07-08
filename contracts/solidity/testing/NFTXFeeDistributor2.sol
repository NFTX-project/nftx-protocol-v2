// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../NFTXFeeDistributor.sol";

contract NFTXFeeDistributor2 is NFTXFeeDistributor {
    function sum(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }
}
