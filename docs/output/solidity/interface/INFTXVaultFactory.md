# Solidity API

## INFTXVaultFactory

### numVaults

```solidity
function numVaults() external view returns (uint256)
```

### zapContract

```solidity
function zapContract() external view returns (address)
```

### feeDistributor

```solidity
function feeDistributor() external view returns (address)
```

### eligibilityManager

```solidity
function eligibilityManager() external view returns (address)
```

### vault

```solidity
function vault(uint256 vaultId) external view returns (address)
```

### allVaults

```solidity
function allVaults() external view returns (address[])
```

### vaultsForAsset

```solidity
function vaultsForAsset(address asset) external view returns (address[])
```

### isLocked

```solidity
function isLocked(uint256 id) external view returns (bool)
```

### excludedFromFees

```solidity
function excludedFromFees(address addr) external view returns (bool)
```

### factoryMintFee

```solidity
function factoryMintFee() external view returns (uint64)
```

### factoryRandomRedeemFee

```solidity
function factoryRandomRedeemFee() external view returns (uint64)
```

### factoryTargetRedeemFee

```solidity
function factoryTargetRedeemFee() external view returns (uint64)
```

### factoryRandomSwapFee

```solidity
function factoryRandomSwapFee() external view returns (uint64)
```

### factoryTargetSwapFee

```solidity
function factoryTargetSwapFee() external view returns (uint64)
```

### vaultFees

```solidity
function vaultFees(uint256 vaultId) external view returns (uint256, uint256, uint256, uint256, uint256)
```

### NewFeeDistributor

```solidity
event NewFeeDistributor(address oldDistributor, address newDistributor)
```

### NewZapContract

```solidity
event NewZapContract(address oldZap, address newZap)
```

### FeeExclusion

```solidity
event FeeExclusion(address feeExcluded, bool excluded)
```

### NewEligibilityManager

```solidity
event NewEligibilityManager(address oldEligManager, address newEligManager)
```

### NewVault

```solidity
event NewVault(uint256 vaultId, address vaultAddress, address assetAddress)
```

### UpdateVaultFees

```solidity
event UpdateVaultFees(uint256 vaultId, uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee)
```

### DisableVaultFees

```solidity
event DisableVaultFees(uint256 vaultId)
```

### UpdateFactoryFees

```solidity
event UpdateFactoryFees(uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee)
```

### __NFTXVaultFactory_init

```solidity
function __NFTXVaultFactory_init(address _vaultImpl, address _feeDistributor) external
```

### createVault

```solidity
function createVault(string name, string symbol, address _assetAddress, bool is1155, bool allowAllItems) external returns (uint256)
```

### setFeeDistributor

```solidity
function setFeeDistributor(address _feeDistributor) external
```

### setEligibilityManager

```solidity
function setEligibilityManager(address _eligibilityManager) external
```

### setZapContract

```solidity
function setZapContract(address _zapContract) external
```

### setFeeExclusion

```solidity
function setFeeExclusion(address _excludedAddr, bool excluded) external
```

### setFactoryFees

```solidity
function setFactoryFees(uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee) external
```

### setVaultFees

```solidity
function setVaultFees(uint256 vaultId, uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee) external
```

### disableVaultFees

```solidity
function disableVaultFees(uint256 vaultId) external
```

