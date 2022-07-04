# Solidity API

## EnumerableSetUpgradeable

_Library for managing
https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
types.

Sets have the following properties:

- Elements are added, removed, and checked for existence in constant time
(O(1)).
- Elements are enumerated in O(n). No guarantees are made on the ordering.

```
contract Example {
    // Add the library methods
    using EnumerableSet for EnumerableSet.AddressSet;

    // Declare a set state variable
    EnumerableSet.AddressSet private mySet;
}
```

As of v3.3.0, sets of type `bytes32` (`Bytes32Set`), `address` (`AddressSet`)
and `uint256` (`UintSet`) are supported._

### Set

```solidity
struct Set {
  bytes32[] _values;
  mapping(bytes32 &#x3D;&gt; uint256) _indexes;
}
```

### _add

```solidity
function _add(struct EnumerableSetUpgradeable.Set set, bytes32 value) private returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableSetUpgradeable.Set set, bytes32 value) private returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### _contains

```solidity
function _contains(struct EnumerableSetUpgradeable.Set set, bytes32 value) private view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### _length

```solidity
function _length(struct EnumerableSetUpgradeable.Set set) private view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### _at

```solidity
function _at(struct EnumerableSetUpgradeable.Set set, uint256 index) private view returns (bytes32)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### Bytes32Set

```solidity
struct Bytes32Set {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.Bytes32Set set, bytes32 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.Bytes32Set set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.Bytes32Set set, uint256 index) internal view returns (bytes32)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### AddressSet

```solidity
struct AddressSet {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.AddressSet set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### UintSet

```solidity
struct UintSet {
  struct EnumerableSetUpgradeable.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSetUpgradeable.UintSet set, uint256 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSetUpgradeable.UintSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct EnumerableSetUpgradeable.UintSet set, uint256 index) internal view returns (uint256)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

