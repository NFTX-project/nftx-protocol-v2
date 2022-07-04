# Solidity API

## PausableUpgradeable

### __Pausable_init

```solidity
function __Pausable_init() internal
```

### SetPaused

```solidity
event SetPaused(uint256 lockId, bool paused)
```

### SetIsGuardian

```solidity
event SetIsGuardian(address addr, bool isGuardian)
```

### isGuardian

```solidity
mapping(address => bool) isGuardian
```

### isPaused

```solidity
mapping(uint256 => bool) isPaused
```

### onlyOwnerIfPaused

```solidity
function onlyOwnerIfPaused(uint256 lockId) public view virtual
```

### unpause

```solidity
function unpause(uint256 lockId) public virtual
```

### pause

```solidity
function pause(uint256 lockId) public virtual
```

### setIsGuardian

```solidity
function setIsGuardian(address addr, bool _isGuardian) public virtual
```

