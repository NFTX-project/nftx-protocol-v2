# Solidity API

## UniqueEligibility

### eligibleBitMap

```solidity
mapping(uint256 => uint256) eligibleBitMap
```

### UniqueEligibilitiesSet

```solidity
event UniqueEligibilitiesSet(uint256[] tokenIds, bool isEligible)
```

### isUniqueEligible

```solidity
function isUniqueEligible(uint256 tokenId) public view virtual returns (bool)
```

### _setUniqueEligibilities

```solidity
function _setUniqueEligibilities(uint256[] tokenIds, bool _isEligible) internal virtual
```

### _setBit

```solidity
function _setBit(uint256 bitMap, uint256 index, bool eligible) internal pure returns (uint256)
```

### _getBit

```solidity
function _getBit(uint256 bitMap, uint256 index) internal pure returns (bool)
```

