# Solidity API

## NFTXEligibility

This is a contract is intended to be inherited and overriden when creating
an eligibility module. The functions outlined will be called throughout the NFTX
vault journey and this abstract contract provides a number of helper functions.

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

### finalized

```solidity
function finalized() public view virtual returns (bool)
```

If the eligibility has been finalized then it can no longer be updated,
meaning the processing logic can no longer be modified and it is safe to use.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | If the eligibility module is finalized |

### targetAsset

```solidity
function targetAsset() public pure virtual returns (address)
```

Allows the module to define an asset that is targetted. This can be
subsequently used for internal calls to reference the token address being
queried.

_This is not a required field, and can just return `address(0)` if no
subsequent use is needed._

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The address of the asset being referenced by the module |

### __NFTXEligibility_init_bytes

```solidity
function __NFTXEligibility_init_bytes(bytes initData) public virtual
```

Called when initialising the eligibility module, allowing configuring data
to be passed and initial module contract setup to be performed.

_If no further configuration is required, then we can just omit providing the
bytes with an attribute name and ignore any calculation._

| Name | Type | Description |
| ---- | ---- | ----------- |
| initData | bytes | This allows for abi encoded bytes to be decoded when initialised and allow the module implementation to vary based on the vault's requirements. |

### checkIsEligible

```solidity
function checkIsEligible(uint256 tokenId) external view virtual returns (bool)
```

Checks if a tokenId is eligible to be received by the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | A tokenId to check the eligibility of |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the tokenId is eligible to be received by the module's logic for the vault, and False if it is not. |

### checkEligible

```solidity
function checkEligible(uint256[] tokenIds) external view virtual returns (bool[])
```

Checks if an array of tokenIds are eligible to be received by the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds to check the eligibility of |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool[] | True if the tokenId is eligible to be received by the module's logic for the vault, and False if it is not. The array of booleans will follow the same order as the tokenIds were passed. |

### checkAllEligible

```solidity
function checkAllEligible(uint256[] tokenIds) external view virtual returns (bool)
```

Checks if all tokenIds in an array are eligible to be received by the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds to check the eligibility of |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if _all_ tokenIds are eligible to be received by the module's logic for the vault, and False if any are not. |

### checkAllIneligible

```solidity
function checkAllIneligible(uint256[] tokenIds) external view virtual returns (bool)
```

Checks if all provided NFTs are NOT eligible. This is needed for mint requesting
where all NFTs provided must be ineligible.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds to check the eligibility of |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if _none_ tokenIds are eligible to be received by the module's logic for the vault, and False if any are. |

### beforeMintHook

```solidity
function beforeMintHook(uint256[] tokenIds) external virtual
```

Called before tokenIds are minted into the NFTX vault.

_This function is not currently implemented in the NFTX Vault._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds |

### afterMintHook

```solidity
function afterMintHook(uint256[] tokenIds) external virtual
```

Called after tokenIds have been minted into the NFTX vault.

_This function is not currently implemented in the NFTX Vault._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds |

### beforeRedeemHook

```solidity
function beforeRedeemHook(uint256[] tokenIds) external virtual
```

Called before tokenIds are redeemed from the NFTX vault.

_This function is not currently implemented in the NFTX Vault._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds |

### afterRedeemHook

```solidity
function afterRedeemHook(uint256[] tokenIds) external virtual
```

Called after tokenIds are redeemed from the NFTX vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenIds | uint256[] | An array of tokenIds |

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

