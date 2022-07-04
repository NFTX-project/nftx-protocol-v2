# Solidity API

## NFTXLPStaking

### nftxVaultFactory

```solidity
contract INFTXVaultFactory nftxVaultFactory
```

Contract address of the NFTX Vault Factory contract

### rewardDistTokenImpl

```solidity
contract IRewardDistributionToken rewardDistTokenImpl
```

The contract that will handle token distribution for rewards

### stakingTokenProvider

```solidity
contract StakingTokenProvider stakingTokenProvider
```

The address of the staking token provider

### PoolCreated

```solidity
event PoolCreated(uint256 vaultId, address pool)
```

Emitted when a Liquidity Pool is created

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| pool | address | The address of the Liquidity Pool |

### PoolUpdated

```solidity
event PoolUpdated(uint256 vaultId, address pool)
```

Emitted when a Liquidity Pool is updated

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| pool | address | The address of the Liquidity Pool |

### FeesReceived

```solidity
event FeesReceived(uint256 vaultId, uint256 amount)
```

Emitted when fees are received by a Liquidity Pool

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| amount | uint256 | The amount of fees received |

### StakingPool

```solidity
struct StakingPool {
  address stakingToken;
  address rewardToken;
}
```

### vaultStakingInfo

```solidity
mapping(uint256 => struct NFTXLPStaking.StakingPool) vaultStakingInfo
```

Mapping of vault ID to staking pool information

### newTimelockRewardDistTokenImpl

```solidity
contract TimelockRewardDistributionTokenImpl newTimelockRewardDistTokenImpl
```

Reward distribution token timelock implementation

### __NFTXLPStaking__init

```solidity
function __NFTXLPStaking__init(address _stakingTokenProvider) external
```

Sets up the NFTX Liquidity Pool Staking contract, applying our NFTX staking token
provider and implementing a token reward distribution implementation.

_Allows for upgradable deployment_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _stakingTokenProvider | address | Address of our Staking Token Provider contract |

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Adds a function modifier to allow an external function to be called by either the
fee distributor or the contract deployer.

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address newFactory) external
```

Allows our internal NFTX Vault Factory contract address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newFactory | address | Address of a `INFTXVaultFactory` implementation |

### setStakingTokenProvider

```solidity
function setStakingTokenProvider(address newProvider) external
```

Allows our internal staking token provider contract address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newProvider | address | Address of a `StakingTokenProvider` implementation |

### addPoolForVault

```solidity
function addPoolForVault(uint256 vaultId) external
```

Allows a liquidity pool to be added to an NFTX vault. This will deploy a dividend token
that will be used for reward distribution.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |

### updatePoolForVaults

```solidity
function updatePoolForVaults(uint256[] vaultIds) external
```

Allows an array of vault IDs to have their liquidity pool updated. This pool should have
either recently or previously been created through the `addPoolForVault` call. This will allow
for provider changes to allow pools to subsequently be updated against vaults.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultIds | uint256[] | Array of NFTX Vault IDs |

### updatePoolForVault

```solidity
function updatePoolForVault(uint256 vaultId) public
```

Allows a vault ID to have their liquidity pool updated. This will allow
for provider changes to allow pools to subsequently be updated against vaults.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |

### receiveRewards

```solidity
function receiveRewards(uint256 vaultId, uint256 amount) external returns (bool)
```

Distributes reward tokens against staking token by vault ID. Rewards are distributed
based on the logic outlined in the `RewardDistributionToken`.

_If the distribution token is not deployed, just forfeit rewards for now._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| amount | uint256 | The amount of reward tokens to be distributed to the pool |

### deposit

```solidity
function deposit(uint256 vaultId, uint256 amount) external
```

More information coming soon.

_Pause code for inventory staking is `10`._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault that owns the tokens |
| amount | uint256 | The number of tokens that should be distributed |

### timelockDepositFor

```solidity
function timelockDepositFor(uint256 vaultId, address account, uint256 amount, uint256 timelockLength) external
```

### exit

```solidity
function exit(uint256 vaultId) external
```

### emergencyExitAndClaim

```solidity
function emergencyExitAndClaim(address _stakingToken, address _rewardToken) external
```

### emergencyExit

```solidity
function emergencyExit(address _stakingToken, address _rewardToken) external
```

### emergencyMigrate

```solidity
function emergencyMigrate(uint256 vaultId) external
```

### withdraw

```solidity
function withdraw(uint256 vaultId, uint256 amount) external
```

### claimRewards

```solidity
function claimRewards(uint256 vaultId) public
```

### claimMultipleRewards

```solidity
function claimMultipleRewards(uint256[] vaultIds) external
```

### newRewardDistributionToken

```solidity
function newRewardDistributionToken(uint256 vaultId) external view returns (contract TimelockRewardDistributionTokenImpl)
```

### rewardDistributionToken

```solidity
function rewardDistributionToken(uint256 vaultId) external view returns (contract IRewardDistributionToken)
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
function rewardDistributionTokenAddr(address stakedToken, address rewardToken) public view returns (address)
```

### balanceOf

```solidity
function balanceOf(uint256 vaultId, address addr) public view returns (uint256)
```

### oldBalanceOf

```solidity
function oldBalanceOf(uint256 vaultId, address addr) public view returns (uint256)
```

### unusedBalanceOf

```solidity
function unusedBalanceOf(uint256 vaultId, address addr) public view returns (uint256)
```

### lockedUntil

```solidity
function lockedUntil(uint256 vaultId, address who) external view returns (uint256)
```

### lockedLPBalance

```solidity
function lockedLPBalance(uint256 vaultId, address who) external view returns (uint256)
```

### _claimRewards

```solidity
function _claimRewards(struct NFTXLPStaking.StakingPool pool, address account) internal
```

### _withdraw

```solidity
function _withdraw(struct NFTXLPStaking.StakingPool pool, uint256 amount, address account) internal
```

### _deployDividendToken

```solidity
function _deployDividendToken(struct NFTXLPStaking.StakingPool pool) internal returns (address)
```

### _rewardDistributionTokenAddr

```solidity
function _rewardDistributionTokenAddr(struct NFTXLPStaking.StakingPool pool) public view returns (contract TimelockRewardDistributionTokenImpl)
```

### _oldRewardDistributionTokenAddr

```solidity
function _oldRewardDistributionTokenAddr(struct NFTXLPStaking.StakingPool pool) public view returns (contract IRewardDistributionToken)
```

### _unusedRewardDistributionTokenAddr

```solidity
function _unusedRewardDistributionTokenAddr(struct NFTXLPStaking.StakingPool pool) public view returns (contract IRewardDistributionToken)
```

### isContract

```solidity
function isContract(address account) internal view returns (bool)
```

### retrieveTokens

```solidity
function retrieveTokens(uint256 vaultId, uint256 amount, address from, address to) public
```

