# Solidity API

## NFTXVaultFactoryUpgradeable

### NOT_USED1

```solidity
uint256 NOT_USED1
```

### zapContract

```solidity
address zapContract
```

### feeDistributor

```solidity
address feeDistributor
```

### eligibilityManager

```solidity
address eligibilityManager
```

### NOT_USED3

```solidity
mapping(uint256 => address) NOT_USED3
```

### _vaultsForAsset

```solidity
mapping(address => address[]) _vaultsForAsset
```

### vaults

```solidity
address[] vaults
```

### excludedFromFees

```solidity
mapping(address => bool) excludedFromFees
```

### VaultFees

```solidity
struct VaultFees {
  bool active;
  uint64 mintFee;
  uint64 randomRedeemFee;
  uint64 targetRedeemFee;
  uint64 randomSwapFee;
  uint64 targetSwapFee;
}
```

### _vaultFees

```solidity
mapping(uint256 => struct NFTXVaultFactoryUpgradeable.VaultFees) _vaultFees
```

### factoryMintFee

```solidity
uint64 factoryMintFee
```

### factoryRandomRedeemFee

```solidity
uint64 factoryRandomRedeemFee
```

### factoryTargetRedeemFee

```solidity
uint64 factoryTargetRedeemFee
```

### factoryRandomSwapFee

```solidity
uint64 factoryRandomSwapFee
```

### factoryTargetSwapFee

```solidity
uint64 factoryTargetSwapFee
```

### __NFTXVaultFactory_init

```solidity
function __NFTXVaultFactory_init(address _vaultImpl, address _feeDistributor) public
```

### createVault

```solidity
function createVault(string name, string symbol, address _assetAddress, bool is1155, bool allowAllItems) external virtual returns (uint256)
```

### setFactoryFees

```solidity
function setFactoryFees(uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee) public virtual
```

### setVaultFees

```solidity
function setVaultFees(uint256 vaultId, uint256 mintFee, uint256 randomRedeemFee, uint256 targetRedeemFee, uint256 randomSwapFee, uint256 targetSwapFee) public virtual
```

### disableVaultFees

```solidity
function disableVaultFees(uint256 vaultId) public virtual
```

### setFeeDistributor

```solidity
function setFeeDistributor(address _feeDistributor) public virtual
```

### setZapContract

```solidity
function setZapContract(address _zapContract) public virtual
```

### setFeeExclusion

```solidity
function setFeeExclusion(address _excludedAddr, bool excluded) public virtual
```

### setEligibilityManager

```solidity
function setEligibilityManager(address _eligibilityManager) external virtual
```

### vaultFees

```solidity
function vaultFees(uint256 vaultId) external view virtual returns (uint256, uint256, uint256, uint256, uint256)
```

### isLocked

```solidity
function isLocked(uint256 lockId) external view virtual returns (bool)
```

### vaultsForAsset

```solidity
function vaultsForAsset(address assetAddress) external view virtual returns (address[])
```

### vault

```solidity
function vault(uint256 vaultId) external view virtual returns (address)
```

### allVaults

```solidity
function allVaults() external view virtual returns (address[])
```

### numVaults

```solidity
function numVaults() external view virtual returns (uint256)
```

### deployVault

```solidity
function deployVault(string name, string symbol, address _assetAddress, bool is1155, bool allowAllItems) internal returns (address)
```

