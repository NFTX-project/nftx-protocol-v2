# Solidity API

## ProxyControllerSimple

### impl

```solidity
address impl
```

### proxy

```solidity
contract IAdminUpgradeabilityProxy proxy
```

### ImplAddressSet

```solidity
event ImplAddressSet(address impl)
```

### ProxyAdminChanged

```solidity
event ProxyAdminChanged(address newAdmin)
```

### constructor

```solidity
constructor(address _proxy) public
```

### getAdmin

```solidity
function getAdmin() public view returns (address admin)
```

### fetchImplAddress

```solidity
function fetchImplAddress() public
```

### changeProxyAdmin

```solidity
function changeProxyAdmin(address newAdmin) public
```

### upgradeProxyTo

```solidity
function upgradeProxyTo(address newImpl) public
```

