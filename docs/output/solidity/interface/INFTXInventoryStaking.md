# Solidity API

## INFTXInventoryStaking

### nftxVaultFactory

```solidity
function nftxVaultFactory() external view returns (contract INFTXVaultFactory)
```

### vaultXToken

```solidity
function vaultXToken(uint256 vaultId) external view returns (address)
```

### xTokenAddr

```solidity
function xTokenAddr(address baseToken) external view returns (address)
```

### xTokenShareValue

```solidity
function xTokenShareValue(uint256 vaultId) external view returns (uint256)
```

### __NFTXInventoryStaking_init

```solidity
function __NFTXInventoryStaking_init(address nftxFactory) external
```

### deployXTokenForVault

```solidity
function deployXTokenForVault(uint256 vaultId) external
```

### receiveRewards

```solidity
function receiveRewards(uint256 vaultId, uint256 amount) external returns (bool)
```

### timelockMintFor

```solidity
function timelockMintFor(uint256 vaultId, uint256 amount, address to, uint256 timelockLength) external returns (uint256)
```

### deposit

```solidity
function deposit(uint256 vaultId, uint256 _amount) external
```

### withdraw

```solidity
function withdraw(uint256 vaultId, uint256 _share) external
```

