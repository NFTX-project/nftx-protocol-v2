# Solidity API

## CryptoPunksMarket

### imageHash

```solidity
string imageHash
```

### owner

```solidity
address owner
```

### standard

```solidity
string standard
```

### name

```solidity
string name
```

### symbol

```solidity
string symbol
```

### decimals

```solidity
uint8 decimals
```

### totalSupply

```solidity
uint256 totalSupply
```

### nextPunkIndexToAssign

```solidity
uint256 nextPunkIndexToAssign
```

### allPunksAssigned

```solidity
bool allPunksAssigned
```

### punksRemainingToAssign

```solidity
uint256 punksRemainingToAssign
```

### punkIndexToAddress

```solidity
mapping(uint256 => address) punkIndexToAddress
```

### balanceOf

```solidity
mapping(address => uint256) balanceOf
```

### Offer

```solidity
struct Offer {
  bool isForSale;
  uint256 punkIndex;
  address seller;
  uint256 minValue;
  address onlySellTo;
}
```

### Bid

```solidity
struct Bid {
  bool hasBid;
  uint256 punkIndex;
  address bidder;
  uint256 value;
}
```

### punksOfferedForSale

```solidity
mapping(uint256 => struct CryptoPunksMarket.Offer) punksOfferedForSale
```

### punkBids

```solidity
mapping(uint256 => struct CryptoPunksMarket.Bid) punkBids
```

### pendingWithdrawals

```solidity
mapping(address => uint256) pendingWithdrawals
```

### Assign

```solidity
event Assign(address to, uint256 punkIndex)
```

### Transfer

```solidity
event Transfer(address from, address to, uint256 value)
```

### PunkTransfer

```solidity
event PunkTransfer(address from, address to, uint256 punkIndex)
```

### PunkOffered

```solidity
event PunkOffered(uint256 punkIndex, uint256 minValue, address toAddress)
```

### PunkBidEntered

```solidity
event PunkBidEntered(uint256 punkIndex, uint256 value, address fromAddress)
```

### PunkBidWithdrawn

```solidity
event PunkBidWithdrawn(uint256 punkIndex, uint256 value, address fromAddress)
```

### PunkBought

```solidity
event PunkBought(uint256 punkIndex, uint256 value, address fromAddress, address toAddress)
```

### PunkNoLongerForSale

```solidity
event PunkNoLongerForSale(uint256 punkIndex)
```

### constructor

```solidity
constructor() public payable
```

### setInitialOwner

```solidity
function setInitialOwner(address to, uint256 punkIndex) public
```

### setInitialOwners

```solidity
function setInitialOwners(address[] addresses, uint256[] indices) public
```

### allInitialOwnersAssigned

```solidity
function allInitialOwnersAssigned() public
```

### getPunk

```solidity
function getPunk(uint256 punkIndex) public
```

### transferPunk

```solidity
function transferPunk(address to, uint256 punkIndex) public
```

### punkNoLongerForSale

```solidity
function punkNoLongerForSale(uint256 punkIndex) public
```

### offerPunkForSale

```solidity
function offerPunkForSale(uint256 punkIndex, uint256 minSalePriceInWei) public
```

### offerPunkForSaleToAddress

```solidity
function offerPunkForSaleToAddress(uint256 punkIndex, uint256 minSalePriceInWei, address toAddress) public
```

### buyPunk

```solidity
function buyPunk(uint256 punkIndex) public payable
```

### withdraw

```solidity
function withdraw() public
```

### enterBidForPunk

```solidity
function enterBidForPunk(uint256 punkIndex) public payable
```

### acceptBidForPunk

```solidity
function acceptBidForPunk(uint256 punkIndex, uint256 minPrice) public
```

### withdrawBidForPunk

```solidity
function withdrawBidForPunk(uint256 punkIndex) public
```

