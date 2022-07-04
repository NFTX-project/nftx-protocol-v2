# Solidity API

## IV1Token

TODO

### burnFrom

```solidity
function burnFrom(address account, uint256 amount) external
```

## NFTXV1Buyout

### BASE

```solidity
uint256 BASE
```

TODO

### ethAvailiable

```solidity
mapping(address => uint256) ethAvailiable
```

TODO

### TokenBuyout

```solidity
event TokenBuyout(address tokenAddress, uint256 totalEth)
```

Emitted when a token buyout is actioned

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | Address of the token |
| totalEth | uint256 | The total amount of ETH spent in the buyout |

### BuyoutComplete

```solidity
event BuyoutComplete(address tokenAddress)
```

Emitted when a token buyout is complete

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenAddress | address | Address of the token |

### __NFTXV1Buyout_init

```solidity
function __NFTXV1Buyout_init() external
```

Initialises the contract.

_Allows for upgradable deployment_

### emergencyWithdraw

```solidity
function emergencyWithdraw() external
```

Allows the owner to withdraw the entirity of the ETH balance to their
wallet.

_This is not a safe transfer, so the owner's address must be capable of
receiving._

### clearBuyout

```solidity
function clearBuyout(address v1TokenAddr) external
```

Removes the ETH available allocation against a token address, setting it
to zero and marking the buyout as complete. The sender will not receive any of the
stored ETH against the mapping.

| Name | Type | Description |
| ---- | ---- | ----------- |
| v1TokenAddr | address | TODO |

### addBuyout

```solidity
function addBuyout(address v1TokenAddr) external payable
```

Receives ETH from the sender and increments it against the provided address.

_SafeMath is not implemented in this function, so is open to overflow._

| Name | Type | Description |
| ---- | ---- | ----------- |
| v1TokenAddr | address | TODO |

### removeBuyout

```solidity
function removeBuyout(address v1TokenAddr) external
```

Removes the full ETH available allocation against a token address, setting
it to zero and marking the buyout as complete. The sender will receive the ETH
allocation stored in the contract against the token address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| v1TokenAddr | address | TODO |

### claimETH

```solidity
function claimETH(address v1TokenAddr) external
```

Burns V1 tokens from the sender and sends ETH from the contract to
the sender in return. The value of the ETH is calculated based on the remaining
supply of the V1 token and the amount of ETH available in the token mapping.

It is only possible for the entirity of the V1 token to be exchanged, and not
a partial amount.

_The function may only be called by the contract owner if paused.
SafeMath is not implemented, so under and overflow will need to be
considered prior to call._

| Name | Type | Description |
| ---- | ---- | ----------- |
| v1TokenAddr | address | TODO |

### sendValue

```solidity
function sendValue(address payable recipient, uint256 amount) internal
```

Sends ETH stored in the contract to a specific recipient address.

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address payable | Address that will receive ETH |
| amount | uint256 | Amount of ETH to be sent |

