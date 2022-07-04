# Solidity API

## BeaconProxy

_This contract implements a proxy that gets the implementation address for each call from a {UpgradeableBeacon}.

The beacon address is stored in storage slot `uint256(keccak256('eip1967.proxy.beacon')) - 1`, so that it doesn't
conflict with the storage layout of the implementation behind the proxy.

_Available since v3.4.__

### _BEACON_SLOT

```solidity
bytes32 _BEACON_SLOT
```

_The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
This is bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)) and is validated in the constructor._

### constructor

```solidity
constructor(address beacon, bytes data) public payable
```

_Initializes the proxy with `beacon`.

If `data` is nonempty, it's used as data in a delegate call to the implementation returned by the beacon. This
will typically be an encoded function call, and allows initializating the storage of the proxy like a Solidity
constructor.

Requirements:

- `beacon` must be a contract with the interface {IBeacon}._

### _beacon

```solidity
function _beacon() internal view virtual returns (address beacon)
```

_Returns the current beacon address._

### _implementation

```solidity
function _implementation() internal view virtual returns (address)
```

_Returns the current implementation address of the associated beacon._

### _setBeacon

```solidity
function _setBeacon(address beacon, bytes data) internal virtual
```

_Changes the proxy to use a new beacon.

If `data` is nonempty, it's used as data in a delegate call to the implementation returned by the beacon.

Requirements:

- `beacon` must be a contract.
- The implementation returned by `beacon` must be a contract._

