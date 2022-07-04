# Solidity API

## INFTXVault

### manager

```solidity
function manager() external view returns (address)
```

### assetAddress

```solidity
function assetAddress() external view returns (address)
```

### vaultFactory

```solidity
function vaultFactory() external view returns (contract INFTXVaultFactory)
```

### eligibilityStorage

```solidity
function eligibilityStorage() external view returns (contract INFTXEligibility)
```

### is1155

```solidity
function is1155() external view returns (bool)
```

### allowAllItems

```solidity
function allowAllItems() external view returns (bool)
```

### enableMint

```solidity
function enableMint() external view returns (bool)
```

### enableRandomRedeem

```solidity
function enableRandomRedeem() external view returns (bool)
```

### enableTargetRedeem

```solidity
function enableTargetRedeem() external view returns (bool)
```

### enableRandomSwap

```solidity
function enableRandomSwap() external view returns (bool)
```

### enableTargetSwap

```solidity
function enableTargetSwap() external view returns (bool)
```

### vaultId

```solidity
function vaultId() external view returns (uint256)
```

### nftIdAt

```solidity
function nftIdAt(uint256 holdingsIndex) external view returns (uint256)
```

### allHoldings

```solidity
function allHoldings() external view returns (uint256[])
```

### totalHoldings

```solidity
function totalHoldings() external view returns (uint256)
```

### mintFee

```solidity
function mintFee() external view returns (uint256)
```

### randomRedeemFee

```solidity
function randomRedeemFee() external view returns (uint256)
```

### targetRedeemFee

```solidity
function targetRedeemFee() external view returns (uint256)
```

### randomSwapFee

```solidity
function randomSwapFee() external view returns (uint256)
```

### targetSwapFee

```solidity
function targetSwapFee() external view returns (uint256)
```

### vaultFees

```solidity
function vaultFees() external view returns (uint256, uint256, uint256, uint256, uint256)
```

### VaultInit

```solidity
event VaultInit(uint256 vaultId, address assetAddress, bool is1155, bool allowAllItems)
```

### ManagerSet

```solidity
event ManagerSet(address manager)
```

### EligibilityDeployed

```solidity
event EligibilityDeployed(uint256 moduleIndex, address eligibilityAddr)
```

### EnableMintUpdated

```solidity
event EnableMintUpdated(bool enabled)
```

### EnableRandomRedeemUpdated

```solidity
event EnableRandomRedeemUpdated(bool enabled)
```

### EnableTargetRedeemUpdated

```solidity
event EnableTargetRedeemUpdated(bool enabled)
```

### EnableRandomSwapUpdated

```solidity
event EnableRandomSwapUpdated(bool enabled)
```

### EnableTargetSwapUpdated

```solidity
event EnableTargetSwapUpdated(bool enabled)
```

### Minted

```solidity
event Minted(uint256[] nftIds, uint256[] amounts, address to)
```

### Redeemed

```solidity
event Redeemed(uint256[] nftIds, uint256[] specificIds, address to)
```

### Swapped

```solidity
event Swapped(uint256[] nftIds, uint256[] amounts, uint256[] specificIds, uint256[] redeemedIds, address to)
```

### __NFTXVault_init

```solidity
function __NFTXVault_init(string _name, string _symbol, address _assetAddress, bool _is1155, bool _allowAllItems) external
```

### finalizeVault

```solidity
function finalizeVault() external
```

### setVaultMetadata

```solidity
function setVaultMetadata(string name_, string symbol_) external
```

### setVaultFeatures

```solidity
function setVaultFeatures(bool _enableMint, bool _enableRandomRedeem, bool _enableTargetRedeem, bool _enableRandomSwap, bool _enableTargetSwap) external
```

### setFees

```solidity
function setFees(uint256 _mintFee, uint256 _randomRedeemFee, uint256 _targetRedeemFee, uint256 _randomSwapFee, uint256 _targetSwapFee) external
```

### disableVaultFees

```solidity
function disableVaultFees() external
```

### deployEligibilityStorage

```solidity
function deployEligibilityStorage(uint256 moduleIndex, bytes initData) external returns (address)
```

### setManager

```solidity
function setManager(address _manager) external
```

### mint

```solidity
function mint(uint256[] tokenIds, uint256[] amounts) external returns (uint256)
```

### mintTo

```solidity
function mintTo(uint256[] tokenIds, uint256[] amounts, address to) external returns (uint256)
```

### redeem

```solidity
function redeem(uint256 amount, uint256[] specificIds) external returns (uint256[])
```

### redeemTo

```solidity
function redeemTo(uint256 amount, uint256[] specificIds, address to) external returns (uint256[])
```

### swap

```solidity
function swap(uint256[] tokenIds, uint256[] amounts, uint256[] specificIds) external returns (uint256[])
```

### swapTo

```solidity
function swapTo(uint256[] tokenIds, uint256[] amounts, uint256[] specificIds, address to) external returns (uint256[])
```

### allValidNFTs

```solidity
function allValidNFTs(uint256[] tokenIds) external view returns (bool)
```

