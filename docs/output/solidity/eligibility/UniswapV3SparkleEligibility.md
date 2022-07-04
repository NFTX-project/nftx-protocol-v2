# Solidity API

## BitMath

_This library provides functionality for computing bit properties of an unsigned integer_

### mostSignificantBit

```solidity
function mostSignificantBit(uint256 x) internal pure returns (uint8 r)
```

Returns the index of the most significant bit of the number,
    where the least significant bit is at index 0 and the most significant bit is at index 255

_The function satisfies the property:
    x >= 2**mostSignificantBit(x) and x < 2**(mostSignificantBit(x)+1)_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | uint256 | the value for which to compute the most significant bit, must be greater than 0 |

| Name | Type | Description |
| ---- | ---- | ----------- |
| r | uint8 | the index of the most significant bit |

## INonfungiblePositionManager

### positions

```solidity
function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)
```

Returns the position information associated with a given token ID.

_Throws if the token ID is not valid._

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | The ID of the token that represents the position |

| Name | Type | Description |
| ---- | ---- | ----------- |
| nonce | uint96 | The nonce for permits |
| operator | address | The address that is approved for spending |
| token0 | address | The address of the token0 for a specific pool |
| token1 | address | The address of the token1 for a specific pool |
| fee | uint24 | The fee associated with the pool |
| tickLower | int24 | The lower end of the tick range for the position |
| tickUpper | int24 | The higher end of the tick range for the position |
| liquidity | uint128 | The liquidity of the position |
| feeGrowthInside0LastX128 | uint256 | The fee growth of token0 as of the last action on the individual position |
| feeGrowthInside1LastX128 | uint256 | The fee growth of token1 as of the last action on the individual position |
| tokensOwed0 | uint128 | The uncollected amount of token0 owed to the position as of the last computation |
| tokensOwed1 | uint128 | The uncollected amount of token1 owed to the position as of the last computation |

### factory

```solidity
function factory() external view returns (address)
```

## UniswapV3SparkleEligibility

### positionManager

```solidity
address positionManager
```

### POOL_INIT_CODE_HASH

```solidity
bytes32 POOL_INIT_CODE_HASH
```

### isInitialized

```solidity
bool isInitialized
```

### validPools

```solidity
mapping(address => bool) validPools
```

### PoolKey

```solidity
struct PoolKey {
  address token0;
  address token1;
  uint24 fee;
}
```

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

### NFTXEligibilityInit

```solidity
event NFTXEligibilityInit()
```

### PoolsAdded

```solidity
event PoolsAdded(address[] poolsAdded)
```

### __NFTXEligibility_init_bytes

```solidity
function __NFTXEligibility_init_bytes(bytes configData) public virtual
```

### __NFTXEligibility_init

```solidity
function __NFTXEligibility_init(address[] _validPools, address _owner) public
```

### addValidPools

```solidity
function addValidPools(address[] newPools) public
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

### isRare

```solidity
function isRare(uint256 tokenId, address poolAddress) internal pure returns (bool)
```

### computeAddress

```solidity
function computeAddress(address factory, struct UniswapV3SparkleEligibility.PoolKey key) internal pure returns (address pool)
```

Deterministically computes the pool address given the factory and PoolKey

| Name | Type | Description |
| ---- | ---- | ----------- |
| factory | address | The Uniswap V3 factory contract address |
| key | struct UniswapV3SparkleEligibility.PoolKey | The PoolKey |

| Name | Type | Description |
| ---- | ---- | ----------- |
| pool | address | The contract address of the V3 pool |

