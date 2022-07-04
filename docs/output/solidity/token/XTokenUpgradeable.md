# Solidity API

## XTokenUpgradeable

### MAX_TIMELOCK

```solidity
uint256 MAX_TIMELOCK
```

### baseToken

```solidity
contract IERC20Upgradeable baseToken
```

### timelock

```solidity
mapping(address => uint256) timelock
```

### Timelocked

```solidity
event Timelocked(address user, uint256 until)
```

### __XToken_init

```solidity
function __XToken_init(address _baseToken, string name, string symbol) public
```

### mintXTokens

```solidity
function mintXTokens(address account, uint256 _amount, uint256 timelockLength) external returns (uint256)
```

### burnXTokens

```solidity
function burnXTokens(address who, uint256 _share) external returns (uint256)
```

### timelockAccount

```solidity
function timelockAccount(address account, uint256 timelockLength) public virtual
```

### _burn

```solidity
function _burn(address who, uint256 amount) internal
```

### timelockUntil

```solidity
function timelockUntil(address account) public view returns (uint256)
```

### _timelockMint

```solidity
function _timelockMint(address account, uint256 amount, uint256 timelockLength) internal virtual
```

### _transfer

```solidity
function _transfer(address from, address to, uint256 value) internal
```

