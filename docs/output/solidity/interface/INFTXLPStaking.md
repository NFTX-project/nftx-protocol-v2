# Solidity API

## INFTXLPStaking

### nftxVaultFactory

```solidity
function nftxVaultFactory() external view returns (address)
```

### rewardDistTokenImpl

```solidity
function rewardDistTokenImpl() external view returns (address)
```

### stakingTokenProvider

```solidity
function stakingTokenProvider() external view returns (address)
```

### vaultToken

```solidity
function vaultToken(address _stakingToken) external view returns (address)
```

### stakingToken

```solidity
function stakingToken(address _vaultToken) external view returns (address)
```

### rewardDistributionToken

```solidity
function rewardDistributionToken(uint256 vaultId) external view returns (address)
```

### newRewardDistributionToken

```solidity
function newRewardDistributionToken(uint256 vaultId) external view returns (address)
```

### oldRewardDistributionToken

```solidity
function oldRewardDistributionToken(uint256 vaultId) external view returns (address)
```

### unusedRewardDistributionToken

```solidity
function unusedRewardDistributionToken(uint256 vaultId) external view returns (address)
```

### rewardDistributionTokenAddr

```solidity
function rewardDistributionTokenAddr(address stakedToken, address rewardToken) external view returns (address)
```

### __NFTXLPStaking__init

```solidity
function __NFTXLPStaking__init(address _stakingTokenProvider) external
```

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address newFactory) external
```

### setStakingTokenProvider

```solidity
function setStakingTokenProvider(address newProvider) external
```

### addPoolForVault

```solidity
function addPoolForVault(uint256 vaultId) external
```

### updatePoolForVault

```solidity
function updatePoolForVault(uint256 vaultId) external
```

### updatePoolForVaults

```solidity
function updatePoolForVaults(uint256[] vaultId) external
```

### receiveRewards

```solidity
function receiveRewards(uint256 vaultId, uint256 amount) external returns (bool)
```

### deposit

```solidity
function deposit(uint256 vaultId, uint256 amount) external
```

### timelockDepositFor

```solidity
function timelockDepositFor(uint256 vaultId, address account, uint256 amount, uint256 timelockLength) external
```

### exit

```solidity
function exit(uint256 vaultId, uint256 amount) external
```

### rescue

```solidity
function rescue(uint256 vaultId) external
```

### withdraw

```solidity
function withdraw(uint256 vaultId, uint256 amount) external
```

### claimRewards

```solidity
function claimRewards(uint256 vaultId) external
```

