# Solidity API

## FlashBorrower

### Action

```solidity
enum Action {
  NORMAL,
  STEAL,
  REENTER
}
```

### flashBalance

```solidity
uint256 flashBalance
```

### flashUser

```solidity
address flashUser
```

### flashToken

```solidity
address flashToken
```

### flashValue

```solidity
uint256 flashValue
```

### flashFee

```solidity
uint256 flashFee
```

### onFlashLoan

```solidity
function onFlashLoan(address user, address token, uint256 value, uint256 fee, bytes data) external returns (bytes32)
```

_ERC-3156 Flash loan callback_

### flashBorrow

```solidity
function flashBorrow(address lender, address token, uint256 value) public
```

### flashBorrowAndSteal

```solidity
function flashBorrowAndSteal(address lender, address token, uint256 value) public
```

### flashBorrowAndReenter

```solidity
function flashBorrowAndReenter(address lender, address token, uint256 value) public
```

