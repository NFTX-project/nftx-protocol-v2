# Solidity API

## SafeERC20Upgradeable

_Wrappers around ERC20 operations that throw on failure (when the token
contract returns false). Tokens that return no value (and instead revert or
throw on failure) are also supported, non-reverting calls are assumed to be
successful.
To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
which allows you to call the safe operations as `token.safeTransfer(...)`, etc._

### safeTransfer

```solidity
function safeTransfer(contract IERC20Upgradeable token, address to, uint256 value) internal
```

### safeTransferFrom

```solidity
function safeTransferFrom(contract IERC20Upgradeable token, address from, address to, uint256 value) internal
```

### safeApprove

```solidity
function safeApprove(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

_Deprecated. This function has issues similar to the ones found in
{IERC20-approve}, and its usage is discouraged.

Whenever possible, use {safeIncreaseAllowance} and
{safeDecreaseAllowance} instead._

### safeIncreaseAllowance

```solidity
function safeIncreaseAllowance(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

### safeDecreaseAllowance

```solidity
function safeDecreaseAllowance(contract IERC20Upgradeable token, address spender, uint256 value) internal
```

### _callOptionalReturn

```solidity
function _callOptionalReturn(contract IERC20Upgradeable token, bytes data) private
```

_Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
on the return value: the return value is optional (but if data is returned, it must not be false)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | contract IERC20Upgradeable | The token targeted by the call. |
| data | bytes | The call data (encoded using abi.encode or one of its variants). |

