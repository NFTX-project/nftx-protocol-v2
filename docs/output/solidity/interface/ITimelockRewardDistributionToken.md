# Solidity API

## ITimelockRewardDistributionToken

### distributeRewards

```solidity
function distributeRewards(uint256 amount) external
```

### __TimelockRewardDistributionToken_init

```solidity
function __TimelockRewardDistributionToken_init(contract IERC20Upgradeable _target, string _name, string _symbol) external
```

### mint

```solidity
function mint(address account, address to, uint256 amount) external
```

### timelockMint

```solidity
function timelockMint(address account, uint256 amount, uint256 timelockLength) external
```

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

### withdrawReward

```solidity
function withdrawReward(address user) external
```

### dividendOf

```solidity
function dividendOf(address _owner) external view returns (uint256)
```

### withdrawnRewardOf

```solidity
function withdrawnRewardOf(address _owner) external view returns (uint256)
```

### accumulativeRewardOf

```solidity
function accumulativeRewardOf(address _owner) external view returns (uint256)
```

### timelockUntil

```solidity
function timelockUntil(address account) external view returns (uint256)
```

