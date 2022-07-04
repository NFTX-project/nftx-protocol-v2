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

## PalmNFTXStakingZap

### pairedToken

```solidity
contract IERC20Upgradeable pairedToken
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

### lockTime

```solidity
uint256 lockTime
```

### BASE

```solidity
uint256 BASE
```

### UserStaked

```solidity
event UserStaked(uint256 vaultId, uint256 count, uint256 lpBalance, uint256 timelockUntil, address sender)
```

### constructor

```solidity
constructor(address _nftxFactory, address _sushiRouter, address _pairedToken) public
```

### setLockTime

```solidity
function setLockTime(uint256 newLockTime) external
```

### addLiquidity721

```solidity
function addLiquidity721(uint256 vaultId, uint256[] ids, uint256 minWethIn, uint256 wethIn) public returns (uint256)
```

### addLiquidity721To

```solidity
function addLiquidity721To(uint256 vaultId, uint256[] ids, uint256 minWethIn, uint256 wethIn, address to) public returns (uint256)
```

### addLiquidity1155

```solidity
function addLiquidity1155(uint256 vaultId, uint256[] ids, uint256[] amounts, uint256 minWethIn, uint256 wethIn) public returns (uint256)
```

### addLiquidity1155To

```solidity
function addLiquidity1155To(uint256 vaultId, uint256[] ids, uint256[] amounts, uint256 minWethIn, uint256 wethIn, address to) public returns (uint256)
```

### lockedUntil

```solidity
function lockedUntil(uint256 vaultId, address who) external view returns (uint256)
```

### lockedLPBalance

```solidity
function lockedLPBalance(uint256 vaultId, address who) external view returns (uint256)
```

### _addLiquidity721WETH

```solidity
function _addLiquidity721WETH(uint256 vaultId, uint256[] ids, uint256 minWethIn, uint256 wethIn, address to) internal returns (uint256, uint256, uint256)
```

### _addLiquidity1155WETH

```solidity
function _addLiquidity1155WETH(uint256 vaultId, uint256[] ids, uint256[] amounts, uint256 minWethIn, uint256 wethIn, address to) internal returns (uint256, uint256, uint256)
```

### _addLiquidityAndLock

```solidity
function _addLiquidityAndLock(uint256 vaultId, address vault, uint256 minTokenIn, uint256 minWethIn, uint256 wethIn, address to) internal returns (uint256, uint256, uint256)
```

### transferFromERC721

```solidity
function transferFromERC721(address assetAddr, uint256 tokenId) internal virtual
```

### approveERC721

```solidity
function approveERC721(address assetAddr, address to, uint256) internal virtual
```

### pairFor

```solidity
function pairFor(address tokenA, address tokenB) internal view returns (address pair)
```

### sortTokens

```solidity
function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1)
```

### receive

```solidity
receive() external payable
```

