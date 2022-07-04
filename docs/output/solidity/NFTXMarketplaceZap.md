# Solidity API

## IWETH

### deposit

```solidity
function deposit() external payable
```

### transfer

```solidity
function transfer(address to, uint256 value) external returns (bool)
```

### withdraw

```solidity
function withdraw(uint256) external
```

### balanceOf

```solidity
function balanceOf(address to) external view returns (uint256)
```

## ReentrancyGuard

_Contract module that helps prevent reentrant calls to a function.

Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
available, which can be applied to functions to make sure there are no nested
(reentrant) calls to them.

Note that because there is a single `nonReentrant` guard, functions marked as
`nonReentrant` may not call one another. This can be worked around by making
those functions `private`, and then adding `external` `nonReentrant` entry
points to them.

TIP: If you would like to learn more about reentrancy and alternative ways
to protect against it, check out our blog post
https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]._

### _NOT_ENTERED

```solidity
uint256 _NOT_ENTERED
```

### _ENTERED

```solidity
uint256 _ENTERED
```

### _status

```solidity
uint256 _status
```

### constructor

```solidity
constructor() internal
```

### nonReentrant

```solidity
modifier nonReentrant()
```

_Prevents a contract from calling itself, directly or indirectly.
Calling a `nonReentrant` function from another `nonReentrant`
function is not supported. It is possible to prevent this from happening
by making the `nonReentrant` function external, and make it call a
`private` function that does the actual work._

## Ownable

_Contract module which provides a basic access control mechanism, where
there is an account (an owner) that can be granted exclusive access to
specific functions.

By default, the owner account will be the one that deploys the contract. This
can later be changed with {transferOwnership}.

This module is used through inheritance. It will make available the modifier
`onlyOwner`, which can be applied to your functions to restrict their use to
the owner._

### _owner

```solidity
address _owner
```

### OwnershipTransferred

```solidity
event OwnershipTransferred(address previousOwner, address newOwner)
```

### constructor

```solidity
constructor() internal
```

_Initializes the contract setting the deployer as the initial owner._

### owner

```solidity
function owner() public view virtual returns (address)
```

_Returns the address of the current owner._

### onlyOwner

```solidity
modifier onlyOwner()
```

_Throws if called by any account other than the owner._

### renounceOwnership

```solidity
function renounceOwnership() public virtual
```

_Leaves the contract without owner. It will not be possible to call
`onlyOwner` functions anymore. Can only be called by the current owner.

NOTE: Renouncing ownership will leave the contract without an owner,
thereby removing any functionality that is only available to the owner._

### transferOwnership

```solidity
function transferOwnership(address newOwner) public virtual
```

_Transfers ownership of the contract to a new account (`newOwner`).
Can only be called by the current owner._

### _setOwner

```solidity
function _setOwner(address newOwner) private
```

## NFTXMarketplaceZap

### WETH

```solidity
contract IWETH WETH
```

### lpStaking

```solidity
contract INFTXLPStaking lpStaking
```

### nftxFactory

```solidity
contract INFTXVaultFactory nftxFactory
```

### sushiRouter

```solidity
contract IUniswapV2Router01 sushiRouter
```

### BASE

```solidity
uint256 BASE
```

### Buy

```solidity
event Buy(uint256 count, uint256 ethSpent, address to)
```

### Sell

```solidity
event Sell(uint256 count, uint256 ethReceived, address to)
```

### Swap

```solidity
event Swap(uint256 count, uint256 ethSpent, address to)
```

### constructor

```solidity
constructor(address _nftxFactory, address _sushiRouter) public
```

### mintAndSell721

```solidity
function mintAndSell721(uint256 vaultId, uint256[] ids, uint256 minEthOut, address[] path, address to) external
```

### mintAndSell721WETH

```solidity
function mintAndSell721WETH(uint256 vaultId, uint256[] ids, uint256 minWethOut, address[] path, address to) external
```

### buyAndSwap721

```solidity
function buyAndSwap721(uint256 vaultId, uint256[] idsIn, uint256[] specificIds, address[] path, address to) external payable
```

### buyAndSwap721WETH

```solidity
function buyAndSwap721WETH(uint256 vaultId, uint256[] idsIn, uint256[] specificIds, uint256 maxWethIn, address[] path, address to) external
```

### buyAndSwap1155

```solidity
function buyAndSwap1155(uint256 vaultId, uint256[] idsIn, uint256[] amounts, uint256[] specificIds, address[] path, address to) external payable
```

### buyAndSwap1155WETH

```solidity
function buyAndSwap1155WETH(uint256 vaultId, uint256[] idsIn, uint256[] amounts, uint256[] specificIds, uint256 maxWethIn, address[] path, address to) external payable
```

### buyAndRedeem

```solidity
function buyAndRedeem(uint256 vaultId, uint256 amount, uint256[] specificIds, address[] path, address to) external payable
```

### buyAndRedeemWETH

```solidity
function buyAndRedeemWETH(uint256 vaultId, uint256 amount, uint256[] specificIds, uint256 maxWethIn, address[] path, address to) external
```

### mintAndSell1155

```solidity
function mintAndSell1155(uint256 vaultId, uint256[] ids, uint256[] amounts, uint256 minWethOut, address[] path, address to) external
```

### mintAndSell1155WETH

```solidity
function mintAndSell1155WETH(uint256 vaultId, uint256[] ids, uint256[] amounts, uint256 minWethOut, address[] path, address to) external
```

### _mint721

```solidity
function _mint721(uint256 vaultId, uint256[] ids) internal returns (address, uint256)
```

### _swap721

```solidity
function _swap721(uint256 vaultId, uint256[] idsIn, uint256[] idsOut, address to) internal returns (address)
```

### _swap1155

```solidity
function _swap1155(uint256 vaultId, uint256[] idsIn, uint256[] amounts, uint256[] idsOut, address to) internal returns (address)
```

### _redeem

```solidity
function _redeem(uint256 vaultId, uint256 amount, uint256[] specificIds, address to) internal
```

### _mint1155

```solidity
function _mint1155(uint256 vaultId, uint256[] ids, uint256[] amounts) internal returns (address, uint256)
```

### _buyVaultToken

```solidity
function _buyVaultToken(uint256 minTokenOut, uint256 maxWethIn, address[] path) internal returns (uint256[])
```

### _sellVaultTokenWETH

```solidity
function _sellVaultTokenWETH(address vault, uint256 minWethOut, uint256 maxTokenIn, address[] path, address to) internal returns (uint256[])
```

### _sellVaultTokenETH

```solidity
function _sellVaultTokenETH(address vault, uint256 minEthOut, uint256 maxTokenIn, address[] path, address to) internal returns (uint256[])
```

### transferFromERC721

```solidity
function transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual
```

### approveERC721

```solidity
function approveERC721(address assetAddr, address to, uint256 tokenId) internal virtual
```

### pairFor

```solidity
function pairFor(address tokenA, address tokenB) internal view returns (address pair)
```

### sortTokens

```solidity
function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1)
```

### rescue

```solidity
function rescue(address token) external
```

### receive

```solidity
receive() external payable
```

