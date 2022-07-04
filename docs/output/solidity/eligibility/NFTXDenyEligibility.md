# Solidity API

## NFTXDenyEligibility

### name

```solidity
function name() public pure virtual returns (string)
```

Defines the constant name of the eligibility module.

_Try to keep the naming convention of the eligibility module short, but
desciptive as this will be displayed to end users looking to implement it._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string | The name of the eligibility module |

### _checkIfEligible

```solidity
function _checkIfEligible(uint256 _tokenId) internal view virtual returns (bool)
```

Contains logic to determine if a tokenId is eligible to be handled by the
NFTX vault.

_This is the minimum required logic to be processed in order to create a
functioning eligibility module._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenId | uint256 | A tokenId to check the eligibility of |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | A boolean representation of the eligibility of the tokenId |

### afterRedeemHook

```solidity
function afterRedeemHook(uint256[] tokenIds) external virtual
```

Called after tokenIds are redeemed from the NFTX vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds |

