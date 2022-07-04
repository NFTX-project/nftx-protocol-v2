# Solidity API

## IRewardDistributionToken

### distributeRewards

```solidity
function distributeRewards(uint256 amount) external
```

### __RewardDistributionToken_init

```solidity
function __RewardDistributionToken_init(contract IERC20Upgradeable _target, string _name, string _symbol) external
```

### mint

```solidity
function mint(address account, address to, uint256 amount) external
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

