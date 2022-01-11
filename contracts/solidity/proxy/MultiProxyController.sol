// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../util/Ownable.sol";
import "../interface/IAdminUpgradeabilityProxy.sol";

contract MultiProxyController is Ownable {
    struct Proxy {
        string name;
        IAdminUpgradeabilityProxy proxy;
        address impl;
    }

    Proxy[] private proxies;

    event ProxyAdded(string name, address proxy);
    event ProxyRemoved(uint256 index);
    event ProxyAdminChanged(uint256 index, address newAdmin);

    constructor(string[] memory _names, address[] memory _proxies) Ownable() {
        uint256 length = _proxies.length;
        require(_names.length == length, "Not equal length");
        for (uint256 i; i < length; i++) {
            addProxy(_names[i], _proxies[i]);
        } 
    }

    function upgradeProxyTo(uint256 index, address newImpl) public onlyOwner {
        require(index < proxies.length, "Out of bounds");
        proxies[index].proxy.upgradeTo(newImpl);
    }

    function changeProxyAdmin(uint256 index, address newAdmin) public onlyOwner {
        require(index < proxies.length, "Out of bounds");
        proxies[index].proxy.changeAdmin(newAdmin);
        emit ProxyAdminChanged(index, newAdmin);
    }

    function addProxy(string memory name, address proxy) public onlyOwner {
        IAdminUpgradeabilityProxy _proxy = IAdminUpgradeabilityProxy(proxy);
        proxies.push(Proxy(name, _proxy, address(0)));
        emit ProxyAdded(name, proxy);
    }

    function removeProxy(uint256 index) public onlyOwner {
        // Preferably want to maintain order to reduce chance of mistake.
        uint256 length = proxies.length;
        if (index >= length) return;

        for (uint i = index; i < length-1; ++i) {
            proxies[i] = proxies[i+1];
        }
        proxies.pop();
        emit ProxyRemoved(index);
    }

    function changeAllAdmins(address newAdmin) public onlyOwner {
        uint256 length = proxies.length;
        for (uint256 i; i < length; ++i) {
            changeProxyAdmin(i, newAdmin);
        }
    }

    function changeAllAdmins(uint256 start, uint256 count, address newAdmin) public onlyOwner {
        require(start + count <= proxies.length, "Out of bounds");
        for (uint256 i = start; i < start + count; ++i) {
            changeProxyAdmin(i, newAdmin);
        }
    }

    function getName(uint256 index) public view returns (string memory) {
        return proxies[index].name;
    }

    function getAdmin(uint256 index) public view returns (address) {
        return proxies[index].proxy.admin();
    }

    function getImpl(uint256 index) public view returns(address) {
        return proxies[index].proxy.implementation();
    }

    function getAllProxiesInfo() public view returns (string[] memory) {
        uint256 length = proxies.length;
        string[] memory proxyInfos = new string[](length);
        for (uint256 i; i < length; ++i) {
            Proxy memory _proxy = proxies[i];
            proxyInfos[i] = string(abi.encodePacked(uint2str(i), ": ", _proxy.name));
        }
        return proxyInfos;
    }

    function getAllProxies() public view returns (address[] memory) {
        uint256 length = proxies.length;
        address[] memory proxyInfos = new address[](length);
        for (uint256 i; i < length; ++i) {
            proxyInfos[i] = address(proxies[i].proxy);
        }
        return proxyInfos;
    }
    
    function getAllImpls() public view returns (address[] memory) {
        uint256 length = proxies.length;
        address[] memory proxyInfos = new address[](length);
        for (uint256 i; i < length; ++i) {
            proxyInfos[i] = address(proxies[i].proxy.implementation());
        }
        return proxyInfos;
    }

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}
