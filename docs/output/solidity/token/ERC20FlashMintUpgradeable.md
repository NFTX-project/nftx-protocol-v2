# Solidity API

## ERC20FlashMintUpgradeable

_Implementation of the ERC3156 Flash loans extension, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156].

Adds the {flashLoan} method, which provides flash loan support at the token
level. By default there is no fee, but this can be changed by overriding {flashFee}._

### __ERC20FlashMint_init

```solidity
function __ERC20FlashMint_init() internal
```

### __ERC20FlashMint_init_unchained

```solidity
function __ERC20FlashMint_init_unchained() internal
```

### RETURN_VALUE

```solidity
bytes32 RETURN_VALUE
```

### maxFlashLoan

```solidity
function maxFlashLoan(address token) public view returns (uint256)
```

_Returns the maximum amount of tokens available for loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The address of the token that is requested. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amont of token that can be loaned. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) public view virtual returns (uint256)
```

_Returns the fee applied when doing flash loans. By default this
implementation has 0 fees. This function can be overloaded to make
the flash loan mechanism deflationary._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The token to be flash loaned. |
| amount | uint256 | The amount of tokens to be loaned. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The fees applied to the corresponding flash loan. |

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

### __gap

```solidity
uint256[50] __gap
```

