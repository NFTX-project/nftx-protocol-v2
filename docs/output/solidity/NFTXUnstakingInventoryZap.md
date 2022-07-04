# Solidity API

## NFTXUnstakingInventoryZap

### vaultFactory

```solidity
contract INFTXVaultFactory vaultFactory
```

### inventoryStaking

```solidity
contract NFTXInventoryStaking inventoryStaking
```

### sushiRouter

```solidity
contract IUniswapV2Router01 sushiRouter
```

### weth

```solidity
contract IWETH weth
```

### InventoryUnstaked

```solidity
event InventoryUnstaked(uint256 vaultId, uint256 xTokensUnstaked, uint256 numNftsRedeemed, address unstaker)
```

### setVaultFactory

```solidity
function setVaultFactory(address addr) public
```

### setInventoryStaking

```solidity
function setInventoryStaking(address addr) public
```

### setSushiRouterAndWeth

```solidity
function setSushiRouterAndWeth(address sushiRouterAddr) public
```

### unstakeInventory

```solidity
function unstakeInventory(uint256 vaultId, uint256 numNfts, uint256 remainingPortionToUnstake) public payable
```

### maxNftsUsingXToken

```solidity
function maxNftsUsingXToken(uint256 vaultId, address staker, address slpToken) public view returns (uint256 numNfts, bool shortByTinyAmount)
```

### receive

```solidity
receive() external payable
```

### rescue

```solidity
function rescue(address token) external
```

