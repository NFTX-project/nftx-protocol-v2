# Solidity API

## MultiProxyController

### Proxy

```solidity
struct Proxy {
  string name;
  contract IAdminUpgradeabilityProxy proxy;
  address impl;
}
```

### proxies

```solidity
struct MultiProxyController.Proxy[] proxies
```

### ProxyAdded

```solidity
event ProxyAdded(string name, address proxy)
```

### ProxyRemoved

```solidity
event ProxyRemoved(uint256 index)
```

### ProxyAdminChanged

```solidity
event ProxyAdminChanged(uint256 index, address newAdmin)
```

### constructor

```solidity
constructor(string[] _names, address[] _proxies) public
```

### upgradeProxyTo

```solidity
function upgradeProxyTo(uint256 index, address newImpl) public
```

### changeProxyAdmin

```solidity
function changeProxyAdmin(uint256 index, address newAdmin) public
```

### addProxy

```solidity
function addProxy(string name, address proxy) public
```

### removeProxy

```solidity
function removeProxy(uint256 index) public
```

### changeAllAdmins

```solidity
function changeAllAdmins(address newAdmin) public
```

### changeAllAdmins

```solidity
function changeAllAdmins(uint256 start, uint256 count, address newAdmin) public
```

### getName

```solidity
function getName(uint256 index) public view returns (string)
```

### getAdmin

```solidity
function getAdmin(uint256 index) public view returns (address)
```

### getImpl

```solidity
function getImpl(uint256 index) public view returns (address)
```

### getAllProxiesInfo

```solidity
function getAllProxiesInfo() public view returns (string[])
```

### getAllProxies

```solidity
function getAllProxies() public view returns (address[])
```

### getAllImpls

```solidity
function getAllImpls() public view returns (address[])
```

### uint2str

```solidity
function uint2str(uint256 _i) internal pure returns (string _uintAsString)
```

