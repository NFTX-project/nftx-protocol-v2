# Solidity API

## UpgradeableBeacon

_This contract is used in conjunction with one or more instances of {BeaconProxy} to determine their
implementation contract, which is where they will delegate all function calls.

An owner is able to change the implementation the beacon points to, thus upgrading the proxies that use this beacon._

### _childImplementation

```solidity
address _childImplementation
```

### Upgraded

```solidity
event Upgraded(address childImplementation)
```

_Emitted when the child implementation returned by the beacon is changed._

### __UpgradeableBeacon__init

```solidity
function __UpgradeableBeacon__init(address childImplementation_) public
```

_Sets the address of the initial implementation, and the deployer account as the owner who can upgrade the
beacon._

### childImplementation

```solidity
function childImplementation() public view virtual returns (address)
```

_Returns the current child implementation address._

### upgradeChildTo

```solidity
function upgradeChildTo(address newChildImplementation) public virtual
```

_Upgrades the beacon to a new implementation.

Emits an {Upgraded} event.

Requirements:

- msg.sender must be the owner of the contract.
- `newChildImplementation` must be a contract._

### _setChildImplementation

```solidity
function _setChildImplementation(address newChildImplementation) private
```

_Sets the implementation contract address for this beacon

Requirements:

- `newChildImplementation` must be a contract._

