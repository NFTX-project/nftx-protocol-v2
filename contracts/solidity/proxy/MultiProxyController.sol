// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../util/Ownable.sol";
import "../interface/IAdminUpgradeabilityProxy.sol";

contract ProxyControllerSimple is Ownable {
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
    }

    function changeAllAdmins(uint256 start, uint256 count, address newAdmin) public onlyOwner {
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
}
