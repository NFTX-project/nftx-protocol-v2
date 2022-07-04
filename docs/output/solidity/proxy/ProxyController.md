# Solidity API

## ProxyController

### vaultFactoryImpl

```solidity
address vaultFactoryImpl
```

### eligManagerImpl

```solidity
address eligManagerImpl
```

### stakingProviderImpl

```solidity
address stakingProviderImpl
```

### stakingImpl

```solidity
address stakingImpl
```

### feeDistribImpl

```solidity
address feeDistribImpl
```

### vaultFactoryProxy

```solidity
contract IAdminUpgradeabilityProxy vaultFactoryProxy
```

### eligManagerProxy

```solidity
contract IAdminUpgradeabilityProxy eligManagerProxy
```

### stakingProviderProxy

```solidity
contract IAdminUpgradeabilityProxy stakingProviderProxy
```

### stakingProxy

```solidity
contract IAdminUpgradeabilityProxy stakingProxy
```

### feeDistribProxy

```solidity
contract IAdminUpgradeabilityProxy feeDistribProxy
```

### ImplAddressSet

```solidity
event ImplAddressSet(uint256 index, address impl)
```

### ProxyAdminChanged

```solidity
event ProxyAdminChanged(uint256 index, address newAdmin)
```

### constructor

```solidity
constructor(address vaultFactory, address eligManager, address stakingProvider, address staking, address feeDistrib) public
```

### getAdmin

```solidity
function getAdmin(uint256 index) public view returns (address admin)
```

### fetchImplAddress

```solidity
function fetchImplAddress(uint256 index) public
```

### changeAllProxyAdmins

```solidity
function changeAllProxyAdmins(address newAdmin) public
```

### changeProxyAdmin

```solidity
function changeProxyAdmin(uint256 index, address newAdmin) public
```

### upgradeProxyTo

```solidity
function upgradeProxyTo(uint256 index, address newImpl) public
```

