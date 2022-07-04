# Solidity API

## NFTXInventoryStaking

### DEFAULT_LOCKTIME

```solidity
uint256 DEFAULT_LOCKTIME
```

Defines a locktime in seconds to prevent flash deposits

### beaconCode

```solidity
bytes beaconCode
```

TODO

### nftxVaultFactory

```solidity
contract INFTXVaultFactory nftxVaultFactory
```

Contract address of the NFTX Vault Factory contract

### inventoryLockTimeErc20

```solidity
uint256 inventoryLockTimeErc20
```

TODO

### timelockExcludeList

```solidity
contract ITimelockExcludeList timelockExcludeList
```

TODO

### XTokenCreated

```solidity
event XTokenCreated(uint256 vaultId, address baseToken, address xToken)
```

Emitted when an xToken is created.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| baseToken | address | Address of the base token |
| xToken | address | Address of the created xToken |

### Deposit

```solidity
event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender)
```

Emitted when tokens are deposited into the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| baseTokenAmount | uint256 | Amount of base token deposited |
| xTokenAmount | uint256 | Amount of xToken deposited |
| timelockUntil | uint256 | The duration of the timelock |
| sender | address | The address of the depositor |

### Withdraw

```solidity
event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender)
```

Emitted when tokens are withdrawn from the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| baseTokenAmount | uint256 | Amount of base token deposited withdrawn |
| xTokenAmount | uint256 | Amount of xToken deposited withdrawn |
| sender | address | The address of the withdrawer |

### FeesReceived

```solidity
event FeesReceived(uint256 vaultId, uint256 amount)
```

Emitted when fees are received by the contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | NFTX Vault ID |
| amount | uint256 | The amount of tokens received |

### __NFTXInventoryStaking_init

```solidity
function __NFTXInventoryStaking_init(address _nftxVaultFactory) external virtual
```

Sets up the NFTX Inventory Staking contract, applying our NFTX vault contract
reference and creates an xToken implementation for the contract and initiates it.

_Allows for upgradable deployment_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _nftxVaultFactory | address | Address of our NFTX Vault Factory contract |

### onlyAdmin

```solidity
modifier onlyAdmin()
```

Adds a function modifier to allow an external function to be called by either the
fee distributor or the contract deployer.

### setTimelockExcludeList

```solidity
function setTimelockExcludeList(address addr) external
```

Allows the timelock exclusion list contract address reference to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Set the address of the timelock exclusion list contract |

### setInventoryLockTimeErc20

```solidity
function setInventoryLockTimeErc20(uint256 time) external
```

Allows the timelock duration to be updated.

_This new timelock duration must be shorter than 14 days._

| Name | Type | Description |
| ---- | ---- | ----------- |
| time | uint256 | New duration of the timelock in seconds |

### isAddressTimelockExcluded

```solidity
function isAddressTimelockExcluded(address addr, uint256 vaultId) public view returns (bool)
```

Check if an asset for a vault is currently timelocked and should be excluded
from being staked.

| Name | Type | Description |
| ---- | ---- | ----------- |
| addr | address | Address of the token |
| vaultId | uint256 | ID of the NFTX vault |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Boolean if the address is excluded from the timelock |

### deployXTokenForVault

```solidity
function deployXTokenForVault(uint256 vaultId) public virtual
```

Deploys an xToken for an NFTX vault, based on the vaultId provided. Further
details on the deployment flow for a token is defined under `_deployXToken`.

_If the xToken address already exists for the vault, then a duplicate token will not
be deployed, but there will still be a gas cost incurred._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |

### receiveRewards

```solidity
function receiveRewards(uint256 vaultId, uint256 amount) external virtual returns (bool)
```

Allows our fee ditributor to call this function in order to trigger rewards to be
pulled into the contract. We don't distribute rewards unless there are people to distribute to
and if the distribution token is not deployed, the rewards are forfeited.

_We "pull" to the dividend tokens so the fee distributor only needs to approve this
contract._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault that owns the tokens |
| amount | uint256 | The number of tokens that should be sent |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | If xTokens were transferred successfully |

### deposit

```solidity
function deposit(uint256 vaultId, uint256 _amount) external virtual
```

Stakes minted tokens against a timelock; gets minted shares, locks base tokens in the
xToken contract and mints xTokens to the sender.

_Pause code for inventory staking is `10`._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault that owns the tokens |
| _amount | uint256 | The number of tokens that should be sent |

### timelockMintFor

```solidity
function timelockMintFor(uint256 vaultId, uint256 amount, address to, uint256 timelockLength) external virtual returns (uint256)
```

TODO

_Must be sent by the NFTX Vault Factory zap contract and the sender must be excluded
from fees._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault that owns the tokens |
| amount | uint256 | The number of tokens that should be sent |
| to | address | Address that the xToken will be sent to |
| timelockLength | uint256 | Duration of the timelock in seconds |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of xTokens minted |

### withdraw

```solidity
function withdraw(uint256 vaultId, uint256 _share) external virtual
```

Allows sender to withdraw their tokens, along with any token gains generated,
from staking. The xTokens are burnt and the base token is sent to the sender.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault that owns the tokens |
| _share | uint256 | The number of xTokens to be burnt |

### xTokenShareValue

```solidity
function xTokenShareValue(uint256 vaultId) external view virtual returns (uint256)
```

Returns the xToken share value from the vault, based on the total supply
of the xToken and the balance of the base token held by the xToken contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Share value of the xToken |

### timelockUntil

```solidity
function timelockUntil(uint256 vaultId, address who) external view returns (uint256)
```

Returns the xToken share value from the vault, based on the total supply
of the xToken and the balance of the base token held by the xToken contract.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |
| who | address | Address to check the timelock against |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | Number of seconds until vault timelock is lifted against an address |

### balanceOf

```solidity
function balanceOf(uint256 vaultId, address who) external view returns (uint256)
```

Returns the xTokens held by an address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |
| who | address | Address to check the balance against |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | The number of xTokens held by an address against a vault |

### xTokenAddr

```solidity
function xTokenAddr(address baseToken) public view virtual returns (address)
```

Returns the corresponding xToken address for a base token.

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseToken | address | The address of the base token |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The equivalent xToken address of the base token |

### vaultXToken

```solidity
function vaultXToken(uint256 vaultId) public view virtual returns (address)
```

Returns the corresponding xToken address for an NFTX vault ID.

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | The equivalent xToken address of the vault |

### _timelockMintFor

```solidity
function _timelockMintFor(uint256 vaultId, address account, uint256 _amount, uint256 timelockLength) internal returns (contract IERC20Upgradeable, contract XTokenUpgradeable, uint256)
```

TODO

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | ID of the NFTX vault |
| account | address | TODO |
| _amount | uint256 | TODO |
| timelockLength | uint256 | TODO |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | contract IERC20Upgradeable | TODO |
| [1] | contract XTokenUpgradeable | TODO |
| [2] | uint256 | TODO |

### _deployXToken

```solidity
function _deployXToken(address baseToken) internal returns (address)
```

TODO

| Name | Type | Description |
| ---- | ---- | ----------- |
| baseToken | address | TODO |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | TODO |

### isContract

```solidity
function isContract(address account) internal view returns (bool)
```

Checks if the provided address is a contract.

_This method relies on extcodesize, which returns 0 for contracts in construction,
since the code is only stored at the end of the constructor execution._

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | Address to be checked |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | Returns `true` if the passed address is a contract |

