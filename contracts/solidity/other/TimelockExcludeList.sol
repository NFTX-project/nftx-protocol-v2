// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../util/Ownable.sol";

contract TimelockExcludeList is Ownable {
    mapping(address => bool) public excludeFromAll;
    mapping(address => mapping(uint256 => bool)) public excludeFromVault;

    event ExcludeFromAllSet(address, bool);
    event ExcludeFromVaultSet(address, uint256, bool);

    function isExcludedFromAll(address addr) public view returns (bool) {
        return excludeFromAll[addr];
    }

    function isExcludedFromVault(address addr, uint256 vaultId)
        public
        view
        returns (bool)
    {
        return excludeFromVault[addr][vaultId];
    }

    function isExcluded(address addr, uint256 vaultId)
        external
        view
        returns (bool)
    {
        return isExcludedFromAll(addr) || isExcludedFromVault(addr, vaultId);
    }

    function setExcludeFromAll(address addr, bool setting) external onlyOwner {
        excludeFromAll[addr] = setting;
        emit ExcludeFromAllSet(addr, setting);
    }

    function setExcludeFromVault(
        address addr,
        uint256 vaultId,
        bool setting
    ) external onlyOwner {
        excludeFromVault[addr][vaultId] = setting;
        emit ExcludeFromVaultSet(addr, vaultId, setting);
    }
}
