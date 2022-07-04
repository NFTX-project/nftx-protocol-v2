# Solidity API

## IBeacon

_This is the interface that {BeaconProxy} expects of its beacon._

### childImplementation

```solidity
function childImplementation() external view returns (address)
```

_Must return an address that can be used as a delegate call target.

{BeaconProxy} will check that this address is a contract._

### upgradeChildTo

```solidity
function upgradeChildTo(address newImplementation) external
```

