# Solidity API

## TimelockRewardDistributionTokenImpl

_A mintable ERC20 token that allows anyone to pay and distribute a target token
 to token holders as dividends and allows token holders to withdraw their dividends.
 Reference: the source code of PoWH3D: https://etherscan.io/address/0xB3775fB83F7D12A36E0475aBdD1FCA35c091efBe#code_

### target

```solidity
contract IERC20Upgradeable target
```

### magnitude

```solidity
uint256 magnitude
```

### magnifiedRewardPerShare

```solidity
uint256 magnifiedRewardPerShare
```

### magnifiedRewardCorrections

```solidity
mapping(address => int256) magnifiedRewardCorrections
```

### withdrawnRewards

```solidity
mapping(address => uint256) withdrawnRewards
```

### timelock

```solidity
mapping(address => uint256) timelock
```

### Timelocked

```solidity
event Timelocked(address user, uint256 amount, uint256 until)
```

### __TimelockRewardDistributionToken_init

```solidity
function __TimelockRewardDistributionToken_init(contract IERC20Upgradeable _target, string _name, string _symbol) public
```

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transfer}.

Requirements:

- `recipient` cannot be the zero address.
- the caller must have a balance of at least `amount`._

### transferFrom

```solidity
function transferFrom(address sender, address recipient, uint256 amount) public virtual returns (bool)
```

_See {IERC20-transferFrom}.

Emits an {Approval} event indicating the updated allowance. This is not
required by the EIP. See the note at the beginning of {ERC20}.

Requirements:

- `sender` and `recipient` cannot be the zero address.
- `sender` must have a balance of at least `amount`.
- the caller must have allowance for ``sender``'s tokens of at least
`amount`._

### mint

```solidity
function mint(address account, uint256 amount) public virtual
```

### timelockMint

```solidity
function timelockMint(address account, uint256 amount, uint256 timelockLength) public virtual
```

### timelockUntil

```solidity
function timelockUntil(address account) public view returns (uint256)
```

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) public virtual
```

_Destroys `amount` tokens from `account`, without deducting from the caller's
allowance. Dangerous.

See {ERC20-_burn} and {ERC20-allowance}._

### distributeRewards

```solidity
function distributeRewards(uint256 amount) external virtual
```

Distributes target to token holders as dividends.

_It reverts if the total supply of tokens is 0.
It emits the `RewardsDistributed` event if the amount of received target is greater than 0.
About undistributed target tokens:
  In each distribution, there is a small amount of target not distributed,
    the magnified amount of which is
    `(amount * magnitude) % totalSupply()`.
  With a well-chosen `magnitude`, the amount of undistributed target
    (de-magnified) in a distribution can be less than 1 wei.
  We can actually keep track of the undistributed target in a distribution
    and try to distribute it in the next distribution,
    but keeping track of such data on-chain costs much more than
    the saved target, so we don't do that._

### withdrawReward

```solidity
function withdrawReward(address user) external
```

Withdraws the target distributed to the sender.

_It emits a `RewardWithdrawn` event if the amount of withdrawn target is greater than 0._

### dividendOf

```solidity
function dividendOf(address _owner) public view returns (uint256)
```

View the amount of dividend in wei that an address can withdraw.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The address of a token holder. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of dividend in wei that `_owner` can withdraw. |

### withdrawableRewardOf

```solidity
function withdrawableRewardOf(address _owner) internal view returns (uint256)
```

View the amount of dividend in wei that an address can withdraw.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The address of a token holder. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of dividend in wei that `_owner` can withdraw. |

### withdrawnRewardOf

```solidity
function withdrawnRewardOf(address _owner) public view returns (uint256)
```

View the amount of dividend in wei that an address has withdrawn.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The address of a token holder. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of dividend in wei that `_owner` has withdrawn. |

### accumulativeRewardOf

```solidity
function accumulativeRewardOf(address _owner) public view returns (uint256)
```

View the amount of dividend in wei that an address has earned in total.

_accumulativeRewardOf(_owner) = withdrawableRewardOf(_owner) + withdrawnRewardOf(_owner)
= (magnifiedRewardPerShare * balanceOf(_owner) + magnifiedRewardCorrections[_owner]) / magnitude_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The address of a token holder. |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The amount of dividend in wei that `_owner` has earned in total. |

### _transfer

```solidity
function _transfer(address from, address to, uint256 value) internal
```

_Internal function that transfer tokens from one address to another.
Update magnifiedRewardCorrections to keep dividends unchanged._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address to transfer from. |
| to | address | The address to transfer to. |
| value | uint256 | The amount to be transferred. |

### _mint

```solidity
function _mint(address account, uint256 value) internal
```

_Internal function that mints tokens to an account.
Update magnifiedRewardCorrections to keep dividends unchanged._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account that will receive the created tokens. |
| value | uint256 | The amount that will be created. |

### _burn

```solidity
function _burn(address account, uint256 value) internal
```

_Internal function that burns an amount of the token of a given account.
Update magnifiedRewardCorrections to keep dividends unchanged._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | The account whose tokens will be burnt. |
| value | uint256 | The amount that will be burnt. |

### RewardsDistributed

```solidity
event RewardsDistributed(address from, uint256 weiAmount)
```

_This event MUST emit when target is distributed to token holders._

| Name | Type | Description |
| ---- | ---- | ----------- |
| from | address | The address which sends target to this contract. |
| weiAmount | uint256 | The amount of distributed target in wei. |

### RewardWithdrawn

```solidity
event RewardWithdrawn(address to, uint256 weiAmount)
```

_This event MUST emit when an address withdraws their dividend._

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The address which withdraws target from this contract. |
| weiAmount | uint256 | The amount of withdrawn target in wei. |

