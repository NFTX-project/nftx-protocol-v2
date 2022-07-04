# Solidity API

## INFTXFeeDistributor

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
function nftxVaultFactory() external returns (address)
```

### lpStaking

```solidity
function lpStaking() external returns (address)
```

### treasury

```solidity
function treasury() external returns (address)
```

### defaultTreasuryAlloc

```solidity
function defaultTreasuryAlloc() external returns (uint256)
```

### defaultLPAlloc

```solidity
function defaultLPAlloc() external returns (uint256)
```

### allocTotal

```solidity
function allocTotal(uint256 vaultId) external returns (uint256)
```

### specificTreasuryAlloc

```solidity
function specificTreasuryAlloc(uint256 vaultId) external returns (uint256)
```

### __FeeDistributor__init__

```solidity
function __FeeDistributor__init__(address _lpStaking, address _treasury) external
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
function addReceiver(uint256 _vaultId, uint256 _allocPoint, address _receiver, bool _isContract) external
```

### initializeVaultReceivers

```solidity
function initializeVaultReceivers(uint256 _vaultId) external
```

### changeMultipleReceiverAlloc

```solidity
function changeMultipleReceiverAlloc(uint256[] _vaultIds, uint256[] _receiverIdxs, uint256[] allocPoints) external
```

### changeMultipleReceiverAddress

```solidity
function changeMultipleReceiverAddress(uint256[] _vaultIds, uint256[] _receiverIdxs, address[] addresses, bool[] isContracts) external
```

### changeReceiverAlloc

```solidity
function changeReceiverAlloc(uint256 _vaultId, uint256 _idx, uint256 _allocPoint) external
```

### changeReceiverAddress

```solidity
function changeReceiverAddress(uint256 _vaultId, uint256 _idx, address _address, bool _isContract) external
```

### removeReceiver

```solidity
function removeReceiver(uint256 _vaultId, uint256 _receiverIdx) external
```

### setTreasuryAddress

```solidity
function setTreasuryAddress(address _treasury) external
```

### setDefaultTreasuryAlloc

```solidity
function setDefaultTreasuryAlloc(uint256 _allocPoint) external
```

### setSpecificTreasuryAlloc

```solidity
function setSpecificTreasuryAlloc(uint256 _vaultId, uint256 _allocPoint) external
```

### setLPStakingAddress

```solidity
function setLPStakingAddress(address _lpStaking) external
```

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address _factory) external
```

### setDefaultLPAlloc

```solidity
function setDefaultLPAlloc(uint256 _allocPoint) external
```

