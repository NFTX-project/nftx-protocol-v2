# Solidity API

## ClaimToken

### claim

```solidity
function claim(uint256[] ids) external returns (uint256)
```

### accumulated

```solidity
function accumulated(uint256 tokenIndex) external returns (uint256)
```

## NFTXFlashSwipe

### BASE

```solidity
uint256 BASE
```

### nftxFactory

```solidity
contract INFTXVaultFactory nftxFactory
```

### NCT

```solidity
contract ClaimToken NCT
```

### WET

```solidity
contract ClaimToken WET
```

### tempLender

```solidity
address tempLender
```

### Type

```solidity
enum Type {
  Hashmasks,
  Waifusion
}
```

### VaultData

```solidity
struct VaultData {
  uint256 vaultId;
  address vaultAddr;
  uint256 count;
  uint256[] specificIds;
  address operator;
  enum NFTXFlashSwipe.Type swipeType;
}
```

### flashSwipeNCT

```solidity
function flashSwipeNCT(address operator, uint256 count, uint256[] specificIds) public
```

### flashSwipeWET

```solidity
function flashSwipeWET(address operator, uint256 count, uint256[] specificIds) public
```

### flashSwipe

```solidity
function flashSwipe(address operator, uint256 vaultId, uint256 count, uint256[] specificIds, enum NFTXFlashSwipe.Type swipeType) public
```

### onFlashLoan

```solidity
function onFlashLoan(address initiator, address, uint256, uint256, bytes data) external returns (bytes32)
```

### flashRedeem

```solidity
function flashRedeem(struct NFTXFlashSwipe.VaultData loanData) internal returns (uint256[])
```

### flashMint

```solidity
function flashMint(address vault, uint256[] specificIds) internal
```

