# Solidity API

## NFTXRangeExtendedEligibility

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

### isInitialized

```solidity
bool isInitialized
```

### rangeStart

```solidity
uint256 rangeStart
```

### rangeEnd

```solidity
uint256 rangeEnd
```

### Config

```solidity
struct Config {
  address owner;
  uint256 rangeStart;
  uint256 rangeEnd;
}
```

### RangeSet

```solidity
event RangeSet(uint256 rangeStart, uint256 rangeEnd)
```

### NFTXEligibilityInit

```solidity
event NFTXEligibilityInit(address owner, uint256 rangeStart, uint256 rangeEnd)
```

### __NFTXEligibility_init_bytes

```solidity
function __NFTXEligibility_init_bytes(bytes _configData) public virtual
```

### __NFTXEligibility_init

```solidity
function __NFTXEligibility_init(address _owner, uint256 _rangeStart, uint256 _rangeEnd) public
```

### setEligibilityPreferences

```solidity
function setEligibilityPreferences(uint256 _rangeStart, uint256 _rangeEnd) external virtual
```

### setUniqueEligibilities

```solidity
function setUniqueEligibilities(uint256[] tokenIds, bool _isEligible) external virtual
```

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
