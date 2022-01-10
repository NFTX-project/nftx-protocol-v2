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

    event ProxyAdded(string name, address proxy, address implementation);
    event ProxyRemoved(uint256 index);
    event ImplAddressSet(uint256 index, address impl);
    event ProxyAdminChanged(uint256 index, address newAdmin);

    constructor() {
    }

    function addProxy(string memory name, address proxy) public onlyOwner {
        IAdminUpgradeabilityProxy _proxy = IAdminUpgradeabilityProxy(proxy);
        address _impl = _proxy.implementation();
        proxies.push(Proxy(name, _proxy, _impl));
        emit ProxyAdded(name, proxy, _impl);
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

    function assignImplAddress(uint256 index) public {
        address _impl = proxies[index].proxy.implementation();
        proxies[index].impl = _impl;
        emit ImplAddressSet(index, _impl);
    }

    function changeProxyAdmin(uint256 index, address newAdmin) public onlyOwner {
        proxies[index].proxy.changeAdmin(newAdmin);
        emit ProxyAdminChanged(index, newAdmin);
    }

    function upgradeProxyTo(uint256 index, address newImpl) public onlyOwner {
        proxies[index].proxy.upgradeTo(newImpl);
        proxies[index].impl = newImpl;
    }

    function changeAllAdmins(address newAdmin) public onlyOwner {
        uint256 length = proxies.length;
        for (uint256 i; i < length; ++i) {
            changeProxyAdmin(i, newAdmin);
        }
    }

    function changeAllAdmins(uint256 start, uint256 count, address newAdmin) public onlyOwner {
        require(start + count < proxies.length, "Out of bounds");
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

    function getImpl(uint256 index) public view returns (address) {
        return proxies[index].impl;
    }

    function getAllProxiesInfo() public view returns (string[] memory) {
        uint256 length = proxies.length;
    }
}
