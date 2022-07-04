# Solidity API

## TimelockExcludeList

### excludeFromAll

```solidity
mapping(address => bool) excludeFromAll
```

### excludeFromVault

```solidity
mapping(address => mapping(uint256 => bool)) excludeFromVault
```

### ExcludeFromAllSet

```solidity
event ExcludeFromAllSet(address, bool)
```

### ExcludeFromVaultSet

```solidity
event ExcludeFromVaultSet(address, uint256, bool)
```

### isExcludedFromAll

```solidity
function isExcludedFromAll(address addr) public view returns (bool)
```

### isExcludedFromVault

```solidity
function isExcludedFromVault(address addr, uint256 vaultId) public view returns (bool)
```

### isExcluded

```solidity
function isExcluded(address addr, uint256 vaultId) external view returns (bool)
```

### setExcludeFromAll

```solidity
function setExcludeFromAll(address addr, bool setting) external
```

### setExcludeFromVault

```solidity
function setExcludeFromVault(address addr, uint256 vaultId, bool setting) external
```

