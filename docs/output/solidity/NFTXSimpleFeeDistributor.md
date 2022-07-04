# Solidity API

## NFTXSimpleFeeDistributor


Contracts and wallets can be excluded from fees through the VaultFactoryUpgradable contract. The owner of the contract can add an address, along with a boolean representation of their exclusion from paying fees, to the `setFeeExclusion` function. This will emit a `FeeExclusion` event and update an internal mapping. This can then be queried by other contracts by performing a call along the lines of `nftxVaultFactory.excludedFromFees(msg.sender)`.

Fees are charged and distributed when an NFT is minted, redeemed or swapped in an NFTX vault. If a user is excluded from fees in this manner then no fees will be send to the `feeDistributor` and no tokens will be transferred via the NFTX Vault contract.

This is used for NFTX zaps to allow for additional transactions to take place before, or instead of, incurring fees.

If fees are not excluded then:
- The amount of fee owed is determined by checking the vault fees that are assigned by it’s creator
- The fee is then transferred to the fee distributor contract attached to the vault
    - This distributor is required during initialisation and its implementation is validated.
    - At this point the fee amount is also sense checked
- The distributor contract then calls the `distribute` function, along with the corresponding vaultId that is calling it
- Distribution logic will vary depending on the contract that is implemented. The different distribution contracts should have ample documentation and commenting to understand.

### distributionPaused

```solidity
bool distributionPaused
```

Flags if distribution is currently paused

### nftxVaultFactory

```solidity
address nftxVaultFactory
```

Contract address of the NFTX Vault Factory contract.

### lpStaking

```solidity
address lpStaking
```

Contract address of the LP Staking contract.

### treasury

```solidity
address treasury
```

Contract address of the NFTX Treasury contract.

### allocTotal

```solidity
uint256 allocTotal
```

Total allocation points per vault.

### feeReceivers

```solidity
struct INFTXSimpleFeeDistributor.FeeReceiver[] feeReceivers
```

Array storage of fee receivers, accessed by index.

### inventoryStaking

```solidity
address inventoryStaking
```

Contract address of the NFTX Inventory Staking contract.

### UpdateTreasuryAddress

```solidity
event UpdateTreasuryAddress(address newTreasury)
```

Emitted when the treasury address is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newTreasury | address | The new address for the treasury contract |

### UpdateLPStakingAddress

```solidity
event UpdateLPStakingAddress(address newLPStaking)
```

Emitted when the LP Staking address is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newLPStaking | address | The new address for the LP Staking contract |

### UpdateInventoryStakingAddress

```solidity
event UpdateInventoryStakingAddress(address newInventoryStaking)
```

Emitted when the Inventory Staking address is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| newInventoryStaking | address | The new address for the Inventory Staking contract |

### UpdateNFTXVaultFactory

```solidity
event UpdateNFTXVaultFactory(address factory)
```

Emitted when the NFTX Vault Factory address is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| factory | address | The new address for the NFTX Vault Factory contract |

### PauseDistribution

```solidity
event PauseDistribution(bool paused)
```

Emitted when this contract is paused or unpaused.

| Name | Type | Description |
| ---- | ---- | ----------- |
| paused | bool | Boolean value of if distribution has been paused (`true`) or unpaused (`false`) |

### AddFeeReceiver

```solidity
event AddFeeReceiver(address receiver, uint256 allocPoint)
```

Emitted when a contract or non-contract receiver is added as a `FeeReceiver`.

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | The address of the new fee recipient |
| allocPoint | uint256 | The number of allocation points assigned to the receiver |

### UpdateFeeReceiverAlloc

```solidity
event UpdateFeeReceiverAlloc(address receiver, uint256 allocPoint)
```

Emitted when a receiver's allocation is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | The address of the updated fee recipient |
| allocPoint | uint256 | The new number of allocation points assigned to the receiver |

### UpdateFeeReceiverAddress

```solidity
event UpdateFeeReceiverAddress(address oldReceiver, address newReceiver)
```

Emitted when a receiver's address is updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| oldReceiver | address | The old address of the receiver |
| newReceiver | address | The new address of the receiver |

### RemoveFeeReceiver

```solidity
event RemoveFeeReceiver(address receiver)
```

Emitted when a receiver's address is removed.

| Name | Type | Description |
| ---- | ---- | ----------- |
| receiver | address | The address of the receiver that was removed |

### __SimpleFeeDistributor__init__

```solidity
function __SimpleFeeDistributor__init__(address _lpStaking, address _treasury) public
```

Initialiser for the fee distributor, setting relevant staking
and treasury addresses.

_Allows for upgradable deployment_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lpStaking | address | Address of our LP Staking contract |
| _treasury | address | Address of our Treasury contract |

### distribute

```solidity
function distribute(uint256 vaultId) external virtual
```

Distributes fees to receivers. All receivers will be iterated over
to distribute their relative allocation of the total number of tokens.

The total balance of the token on the contract will be distributed.

Any dust balance remaining on the contract is transferred to the treasury.

_If distribution is paused or we have no receivers added (defined by
allocTotal) then the entire token balance will be sent to the treasury.

When our receivers are set up by the contract owner they are assigned an
`allocPoint` value that indicates the relative size of the allocation they
will be eligible to receive. This is explained in greater depth on the
`addReceiver` method.

The vault ID will determine the ERC20 token that will be transferred._

| Name | Type | Description |
| ---- | ---- | ----------- |
| vaultId | uint256 | The vault ID that is to have its fees distributed |

### addReceiver

```solidity
function addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) external virtual
```

Adds a receiver to the fee distributor. If a contract receiver is added, then they must
a call to `receiveRewards` as outlined in the `_sendForReceiver` function. The receiver is given
an `allocPoint` value that defines their relative stake of the rewards.

_For the point allocation, if receiver A has 1 `allocPoint` and receiver B has 3 `allocPoint`
then when rewards are distributed they will each receive a percentage based on the relative value.

For example, in this case receiver B would receive 75% of the rewards and receiver A would receive
the remaining 25%._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _allocPoint | uint256 | The point allocation applied to the receiver |
| _receiver | address | The address of the receiver |
| _isContract | bool | Flag to determine if the receiver is a contract, rather than a wallet address |

### initializeVaultReceivers

```solidity
function initializeVaultReceivers(uint256 _vaultId) external
```

Allows the NFTX Vault Factory contract caller to add a pool vault for LP Staking and,
if an inventory staking address is set, then deploys an xToken for the vault.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _vaultId | uint256 | The NFTX vault ID |

### changeReceiverAlloc

```solidity
function changeReceiverAlloc(uint256 _receiverIdx, uint256 _allocPoint) public virtual
```

Allows receiver allocation to be updated.

_Safe math is not implemented, so calculations must not exceed uint256 boundaries for `allocTotal`._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiverIdx | uint256 | The index value of the feeReceiver in our internally stored array |
| _allocPoint | uint256 | The new allocation for the receiver |

### changeReceiverAddress

```solidity
function changeReceiverAddress(uint256 _receiverIdx, address _address, bool _isContract) public virtual
```

Allows receiver address and `isContract` state to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiverIdx | uint256 | The index value of the feeReceiver in our internally stored array |
| _address | address | The new address for the receiver |
| _isContract | bool | The new `isContract` boolean flag for the receiver |

### removeReceiver

```solidity
function removeReceiver(uint256 _receiverIdx) external virtual
```

Removes the receiver from our internal array so that they will no longer be
included in our fee distribution.

_This removal changes the index order of the `feeReceivers` array by moving the
last element to that of the removed value. External sources will need to reflect this
change for future updates before making subsequent calls._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiverIdx | uint256 | The index value of the feeReceiver in our internally stored array |

### setTreasuryAddress

```solidity
function setTreasuryAddress(address _treasury) public
```

Allows our treasury address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _treasury | address | Address of our new Treasury contract |

### setLPStakingAddress

```solidity
function setLPStakingAddress(address _lpStaking) public
```

Allows our LP Staking address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lpStaking | address | Address of our new LP Staking contract |

### setInventoryStakingAddress

```solidity
function setInventoryStakingAddress(address _inventoryStaking) public
```

Allows our Inventory Staking address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _inventoryStaking | address | Address of our new Inventory Staking contract |

### setNFTXVaultFactory

```solidity
function setNFTXVaultFactory(address _factory) external
```

Allows our NFTX Vault Factory address to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _factory | address | Address of our new NFTX Vault Factory contract |

### pauseFeeDistribution

```solidity
function pauseFeeDistribution(bool _pause) external
```

Allows our fee distribution system to be paused or unpaused.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _pause | bool | A boolean representation of if the distribution should be paused |

### rescueTokens

```solidity
function rescueTokens(address _address) external
```

Allows tokens to be rescued from the contract to the sender. This will transfer
the entire balance of the matching ERC20 token.

| Name | Type | Description |
| ---- | ---- | ----------- |
| _address | address | The address of the token to be rescued |

### _addReceiver

```solidity
function _addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) internal virtual
```

Adds a `FeeReceiver` to our internally stored fee receivers array.

_The new receiver will always be added to the end of the array._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _allocPoint | uint256 | The new allocation for the receiver |
| _receiver | address | The address of the receiver |
| _isContract | bool | Flag to determine if the receiver is a contract, rather than a wallet address |

### _sendForReceiver

```solidity
function _sendForReceiver(struct INFTXSimpleFeeDistributor.FeeReceiver _receiver, uint256 _vaultId, address _vault, uint256 amountToSend) internal virtual returns (bool)
```

Sends the specified amount of tokens to a receiver from an NFTX vault.

_If the receiver is a contract then they must implement `receiveRewards` to handle
the fee distribution._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiver | struct INFTXSimpleFeeDistributor.FeeReceiver | Address of the receiver contract or wallet |
| _vaultId | uint256 | The ID of the NFTX vault, provided to the external contract |
| _vault | address | The address of the NFTX vault |
| amountToSend | uint256 | The amount of tokens distributed to the receiver |

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | bool If the tokens were successfully transferred and there are no more tokens left to transfer |

