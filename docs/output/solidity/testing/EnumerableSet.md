# Solidity API

## EnumerableSet

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
function _add(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### _remove

```solidity
function _remove(struct EnumerableSet.Set set, bytes32 value) private returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### _contains

```solidity
function _contains(struct EnumerableSet.Set set, bytes32 value) private view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### _length

```solidity
function _length(struct EnumerableSet.Set set) private view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### _at

```solidity
function _at(struct EnumerableSet.Set set, uint256 index) private view returns (bytes32)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### Bytes32Set

```solidity
struct Bytes32Set {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.Bytes32Set set, bytes32 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.Bytes32Set set, bytes32 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.Bytes32Set set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.Bytes32Set set, uint256 index) internal view returns (bytes32)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### AddressSet

```solidity
struct AddressSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.AddressSet set, address value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.AddressSet set, address value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.AddressSet set) internal view returns (uint256)
```

_Returns the number of values in the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.AddressSet set, uint256 index) internal view returns (address)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._

### UintSet

```solidity
struct UintSet {
  struct EnumerableSet.Set _inner;
}
```

### add

```solidity
function add(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Add a value to a set. O(1).

Returns true if the value was added to the set, that is if it was not
already present._

### remove

```solidity
function remove(struct EnumerableSet.UintSet set, uint256 value) internal returns (bool)
```

_Removes a value from a set. O(1).

Returns true if the value was removed from the set, that is if it was
present._

### contains

```solidity
function contains(struct EnumerableSet.UintSet set, uint256 value) internal view returns (bool)
```

_Returns true if the value is in the set. O(1)._

### length

```solidity
function length(struct EnumerableSet.UintSet set) internal view returns (uint256)
```

_Returns the number of values on the set. O(1)._

### at

```solidity
function at(struct EnumerableSet.UintSet set, uint256 index) internal view returns (uint256)
```

_Returns the value stored at position `index` in the set. O(1).

Note that there are no guarantees on the ordering of values inside the
array, and it may change when more values are added or removed.

Requirements:

- `index` must be strictly less than {length}._
