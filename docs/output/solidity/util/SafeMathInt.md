# Solidity API

## SafeMathInt

_Math operations with safety checks that revert on error
SafeMath adapted for int256
Based on code of  https://github.com/RequestNetwork/requestNetwork/blob/master/packages/requestNetworkSmartContracts/contracts/base/math/SafeMathInt.sol_

### mul

```solidity
function mul(int256 a, int256 b) internal pure returns (int256)
```

### div

```solidity
function div(int256 a, int256 b) internal pure returns (int256)
```

### sub

```solidity
function sub(int256 a, int256 b) internal pure returns (int256)
```

### add

```solidity
function add(int256 a, int256 b) internal pure returns (int256)
```

### toUint256Safe

```solidity
function toUint256Safe(int256 a) internal pure returns (uint256)
```

