# Solidity API

## INFTXEligibility

### name

```solidity
function name() external pure returns (string)
```

### finalized

```solidity
function finalized() external view returns (bool)
```

### targetAsset

```solidity
function targetAsset() external pure returns (address)
```

### checkAllEligible

```solidity
function checkAllEligible(uint256[] tokenIds) external view returns (bool)
```

### checkEligible

```solidity
function checkEligible(uint256[] tokenIds) external view returns (bool[])
```

### checkAllIneligible

```solidity
function checkAllIneligible(uint256[] tokenIds) external view returns (bool)
```

### checkIsEligible

```solidity
function checkIsEligible(uint256 tokenId) external view returns (bool)
```

### __NFTXEligibility_init_bytes

```solidity
function __NFTXEligibility_init_bytes(bytes configData) external
```

### beforeMintHook

```solidity
function beforeMintHook(uint256[] tokenIds) external
```

### afterMintHook

```solidity
function afterMintHook(uint256[] tokenIds) external
```

### beforeRedeemHook

```solidity
function beforeRedeemHook(uint256[] tokenIds) external
```

### afterRedeemHook

```solidity
function afterRedeemHook(uint256[] tokenIds) external
```

