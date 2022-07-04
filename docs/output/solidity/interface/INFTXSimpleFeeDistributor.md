# Solidity API

## INFTXSimpleFeeDistributor

### FeeReceiver

```solidity
struct FeeReceiver {
  uint256 allocPoint;
  address receiver;
  bool isContract;
}
```

### nftxVaultFactory

```solidity
function nftxVaultFactory() external view returns (address)
```

### lpStaking

```solidity
function lpStaking() external view returns (address)
```

### inventoryStaking

```solidity
function inventoryStaking() external view returns (address)
```

### treasury

```solidity
function treasury() external view returns (address)
```

### allocTotal

```solidity
function allocTotal() external view returns (uint256)
```

### __SimpleFeeDistributor__init__

```solidity
function __SimpleFeeDistributor__init__(address _lpStaking, address _treasury) external
```

### rescueTokens

```solidity
function rescueTokens(address token) external
```

### distribute

```solidity
function distribute(uint256 vaultId) external
```

### addReceiver

```solidity
function addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) external
```

### initializeVaultReceivers

```solidity
function initializeVaultReceivers(uint256 _vaultId) external
```

### changeReceiverAlloc

```solidity
function changeReceiverAlloc(uint256 _idx, uint256 _allocPoint) external
```

### changeReceiverAddress

```solidity
function changeReceiverAddress(uint256 _idx, address _address, bool _isContract) external
```

### removeReceiver

```solidity
function removeReceiver(uint256 _receiverIdx) external
```

### setTreasuryAddress

```solidity
function setTreasuryAddress(address _treasury) external
```

### setLPStakingAddress

```solidity
function setLPStakingAddress(address _lpStaking) external
```

### setInventoryStakingAddress

```solidity
function setInventoryStakingAddress(address _inventoryStaking) external
```

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address _factory) external
```

