# Solidity API

## IERC3156FlashBorrowerUpgradeable

_Interface of the ERC3156 FlashBorrower, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156]._

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address token, uint256 amount, uint256 fee, bytes data) external returns (bytes32)
```

_Receive a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| initiator | address | The initiator of the loan. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| fee | uint256 | The additional amount of tokens to repay. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes32 | The keccak256 hash of "ERC3156FlashBorrower.onFlashLoan" |

## IERC3156FlashLenderUpgradeable

_Interface of the ERC3156 FlashLender, as defined in
https://eips.ethereum.org/EIPS/eip-3156[ERC-3156]._

### maxFlashLoan

```solidity
function maxFlashLoan(address token) external view returns (uint256)
```

_The amount of currency available to be lended._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of `token` that can be borrowed. |

### flashFee

```solidity
function flashFee(address token, uint256 amount) external view returns (uint256)
```

_The fee to be charged for a given loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of `token` to be charged for the loan, on top of the returned principal. |

### flashLoan

```solidity
function flashLoan(contract IERC3156FlashBorrowerUpgradeable receiver, address token, uint256 amount, bytes data) external returns (bool)
```

_Initiate a flash loan._

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | contract IERC3156FlashBorrowerUpgradeable | The receiver of the tokens in the loan, and the receiver of the callback. |
| token | address | The loan currency. |
| amount | uint256 | The amount of tokens lent. |
| data | bytes | Arbitrary data structure, intended to contain user-defined parameters. |

