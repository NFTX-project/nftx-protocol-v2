# Solidity API

## NFTXVaultUpgradeable

### base

```solidity
uint256 base
```

### vaultId

```solidity
uint256 vaultId
```

### manager

```solidity
address manager
```

### assetAddress

```solidity
address assetAddress
```

### vaultFactory

```solidity
contract INFTXVaultFactory vaultFactory
```

### eligibilityStorage

```solidity
contract INFTXEligibility eligibilityStorage
```

### randNonce

```solidity
uint256 randNonce
```

### UNUSED_FEE1

```solidity
uint256 UNUSED_FEE1
```

### UNUSED_FEE2

```solidity
uint256 UNUSED_FEE2
```

### UNUSED_FEE3

```solidity
uint256 UNUSED_FEE3
```

### is1155

```solidity
bool is1155
```

### allowAllItems

```solidity
bool allowAllItems
```

### enableMint

```solidity
bool enableMint
```

### enableRandomRedeem

```solidity
bool enableRandomRedeem
```

### enableTargetRedeem

```solidity
bool enableTargetRedeem
```

### holdings

```solidity
struct EnumerableSetUpgradeable.UintSet holdings
```

### quantity1155

```solidity
mapping(uint256 => uint256) quantity1155
```

### enableRandomSwap

```solidity
bool enableRandomSwap
```

### enableTargetSwap

```solidity
bool enableTargetSwap
```

### VaultShutdown

```solidity
event VaultShutdown(address assetAddress, uint256 numItems, address recipient)
```

### __NFTXVault_init

```solidity
function __NFTXVault_init(string _name, string _symbol, address _assetAddress, bool _is1155, bool _allowAllItems) public virtual
```

### finalizeVault

```solidity
function finalizeVault() external virtual
```

### setVaultMetadata

```solidity
function setVaultMetadata(string name_, string symbol_) external virtual
```

### setVaultFeatures

```solidity
function setVaultFeatures(bool _enableMint, bool _enableRandomRedeem, bool _enableTargetRedeem, bool _enableRandomSwap, bool _enableTargetSwap) public virtual
```

### setFees

```solidity
function setFees(uint256 _mintFee, uint256 _randomRedeemFee, uint256 _targetRedeemFee, uint256 _randomSwapFee, uint256 _targetSwapFee) public virtual
```

### disableVaultFees

```solidity
function disableVaultFees() public virtual
```

### deployEligibilityStorage

```solidity
function deployEligibilityStorage(uint256 moduleIndex, bytes initData) external virtual returns (address)
```

### setManager

```solidity
function setManager(address _manager) public virtual
```

### mint

```solidity
function mint(uint256[] tokenIds, uint256[] amounts) external virtual returns (uint256)
```

### mintTo

```solidity
function mintTo(uint256[] tokenIds, uint256[] amounts, address to) public virtual returns (uint256)
```

### redeem

```solidity
function redeem(uint256 amount, uint256[] specificIds) external virtual returns (uint256[])
```

### redeemTo

```solidity
function redeemTo(uint256 amount, uint256[] specificIds, address to) public virtual returns (uint256[])
```

### swap

```solidity
function swap(uint256[] tokenIds, uint256[] amounts, uint256[] specificIds) external virtual returns (uint256[])
```

### swapTo

```solidity
function swapTo(uint256[] tokenIds, uint256[] amounts, uint256[] specificIds, address to) public virtual returns (uint256[])
```

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrowerUpgradeable receiver, address token, uint256 amount, bytes data) public virtual returns (bool)
```

_Performs a flash loan. New tokens are minted and sent to the
`receiver`, who is required to implement the {IERC3156FlashBorrower}
interface. By the end of the flash loan, the receiver is expected to own
amount + fee tokens and have them approved back to the token contract itself so
they can be burned._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrowerUpgradeable | The receiver of the flash loan. Should implement the {IERC3156FlashBorrower.onFlashLoan} interface. |
| token | address | The token to be flash loaned. Only `address(this)` is supported. |
| amount | uint256 | The amount of tokens to be loaned. |
| data | bytes | An arbitrary datafield that is passed to the receiver. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | `true` is the flash loan was successfull. |

### mintFee

```solidity
function mintFee() public view virtual returns (uint256)
```

### randomRedeemFee

```solidity
function randomRedeemFee() public view virtual returns (uint256)
```

### targetRedeemFee

```solidity
function targetRedeemFee() public view virtual returns (uint256)
```

### randomSwapFee

```solidity
function randomSwapFee() public view virtual returns (uint256)
```

### targetSwapFee

```solidity
function targetSwapFee() public view virtual returns (uint256)
```

### vaultFees

```solidity
function vaultFees() public view virtual returns (uint256, uint256, uint256, uint256, uint256)
```

### allValidNFTs

```solidity
function allValidNFTs(uint256[] tokenIds) public view virtual returns (bool)
```

### nftIdAt

```solidity
function nftIdAt(uint256 holdingsIndex) external view virtual returns (uint256)
```

### allHoldings

```solidity
function allHoldings() external view virtual returns (uint256[])
```

### totalHoldings

```solidity
function totalHoldings() external view virtual returns (uint256)
```

### version

```solidity
function version() external pure returns (string)
```

### afterRedeemHook

```solidity
function afterRedeemHook(uint256[] tokenIds) internal virtual
```

### receiveNFTs

```solidity
function receiveNFTs(uint256[] tokenIds, uint256[] amounts) internal virtual returns (uint256)
```

### withdrawNFTsTo

```solidity
function withdrawNFTsTo(uint256 amount, uint256[] specificIds, address to) internal virtual returns (uint256[])
```

### _chargeAndDistributeFees

```solidity
function _chargeAndDistributeFees(address user, uint256 amount) internal virtual
```

### transferERC721

```solidity
function transferERC721(address assetAddr, address to, uint256 tokenId) internal virtual
```

### transferFromERC721

```solidity
function transferFromERC721(address assetAddr, uint256 tokenId) internal virtual
```

### getRandomTokenIdFromVault

```solidity
function getRandomTokenIdFromVault() internal virtual returns (uint256)
```

### onlyPrivileged

```solidity
function onlyPrivileged() internal view
```

### onlyOwnerIfPaused

```solidity
function onlyOwnerIfPaused(uint256 lockId) internal view
```

### retrieveTokens

```solidity
function retrieveTokens(uint256 amount, address from, address to) public
```

### shutdown

```solidity
function shutdown(address recipient) public
```

