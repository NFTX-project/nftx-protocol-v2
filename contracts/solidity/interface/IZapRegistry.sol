// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IZapRegistry {
    function isAZap(address addr) external view returns (bool);

    function isTheZap(address addr, string calldata name)
        external
        view
        returns (bool);
}
