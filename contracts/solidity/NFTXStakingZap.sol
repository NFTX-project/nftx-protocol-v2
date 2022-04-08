// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXSimpleFeeDistributor.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXInventoryStaking.sol";
import "./interface/IUniswapV2Router01.sol";
import "./testing/IERC721.sol";
import "./token/IERC1155Upgradeable.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/ERC721HolderUpgradeable.sol";
import "./token/ERC1155HolderUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./interface/ITimelockExcludeList.sol";

// Authors: @0xKiwi_.

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
}

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and make it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        // On the first call to nonReentrant, _notEntered will be true
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

        // Any calls to nonReentrant after this point will fail
        _status = _ENTERED;

        _;

        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = _NOT_ENTERED;
    }
}

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _setOwner(msg.sender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

contract NFTXStakingZap is Ownable, ReentrancyGuard, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  IWETH public immutable WETH; 
  INFTXLPStaking public lpStaking;
  INFTXInventoryStaking public inventoryStaking;
  INFTXVaultFactory public immutable nftxFactory;
  IUniswapV2Router01 public immutable sushiRouter;
  ITimelockExcludeList public timelockExcludeList;

  uint256 public lpLockTime = 48 hours; 
  uint256 public inventoryLockTime = 7 days; 
  uint256 constant BASE = 1e18;

  event UserStaked(uint256 vaultId, uint256 count, uint256 lpBalance, uint256 timelockUntil, address sender);

  constructor(address _nftxFactory, address _sushiRouter) Ownable() ReentrancyGuard() {
    nftxFactory = INFTXVaultFactory(_nftxFactory);
    sushiRouter = IUniswapV2Router01(_sushiRouter);
    WETH = IWETH(IUniswapV2Router01(_sushiRouter).WETH());
    IERC20Upgradeable(address(IUniswapV2Router01(_sushiRouter).WETH())).safeApprove(_sushiRouter, type(uint256).max);
  }

  function assignStakingContracts() public {
    require(address(lpStaking) == address(0) || address(inventoryStaking) == address(0), "not zero");
    lpStaking = INFTXLPStaking(INFTXSimpleFeeDistributor(INFTXVaultFactory(nftxFactory).feeDistributor()).lpStaking());
    inventoryStaking = INFTXInventoryStaking(INFTXSimpleFeeDistributor(INFTXVaultFactory(nftxFactory).feeDistributor()).inventoryStaking());
  }

  function setTimelockExcludeList(address addr) external onlyOwner {
    timelockExcludeList = ITimelockExcludeList(addr);
  }

  function setLPLockTime(uint256 newLPLockTime) external onlyOwner {
    require(newLPLockTime <= 7 days, "Lock too long");
    lpLockTime = newLPLockTime;
  } 

  function setInventoryLockTime(uint256 newInventoryLockTime) external onlyOwner {
    require(newInventoryLockTime <= 14 days, "Lock too long");
    inventoryLockTime = newInventoryLockTime;
  }

  function isAddressTimelockExcluded(address addr, uint256 vaultId) public view returns (bool) {
        if (address(timelockExcludeList) == address(0)) {
            return false;
        } else {
            return timelockExcludeList.isExcluded(addr, vaultId);
        }
    }

  function provideInventory721(uint256 vaultId, uint256[] calldata tokenIds) external {
    uint256 count = tokenIds.length;
    INFTXVault vault = INFTXVault(nftxFactory.vault(vaultId));
    uint256 timelockTime = isAddressTimelockExcluded(msg.sender, vaultId) ? 0 : inventoryLockTime;
    inventoryStaking.timelockMintFor(vaultId, count*BASE, msg.sender, timelockTime);
    address xToken = inventoryStaking.vaultXToken(vaultId);
    uint256 oldBal = IERC20Upgradeable(vault).balanceOf(xToken);
    uint256[] memory amounts = new uint256[](0);
    address assetAddress = vault.assetAddress();
    uint256 length = tokenIds.length;
    for (uint256 i; i < length; ++i) {
      transferFromERC721(assetAddress, tokenIds[i], address(vault));
      approveERC721(assetAddress, address(vault), tokenIds[i]);
    }
    vault.mintTo(tokenIds, amounts, address(xToken));
    uint256 newBal = IERC20Upgradeable(vault).balanceOf(xToken);
    require(newBal == oldBal + count*BASE, "Incorrect vtokens minted");
    uint256 lockEndTime = block.timestamp + timelockTime;
    emit UserStaked(vaultId, tokenIds.length, 0, lockEndTime, msg.sender);
  }

  function provideInventory1155(uint256 vaultId, uint256[] calldata tokenIds, uint256[] calldata amounts) external {
    uint256 length = tokenIds.length;
    require(length == amounts.length, "Not equal length");
    uint256 count;
    for (uint256 i; i < length; ++i) {
      count += amounts[i];
    }
    INFTXVault vault = INFTXVault(nftxFactory.vault(vaultId));
    uint256 timelockTime = isAddressTimelockExcluded(msg.sender, vaultId) ? 0 : inventoryLockTime;
    inventoryStaking.timelockMintFor(vaultId, count*BASE, msg.sender, timelockTime);
    address xToken = inventoryStaking.vaultXToken(vaultId);
    uint256 oldBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
    IERC1155Upgradeable nft = IERC1155Upgradeable(vault.assetAddress());
    nft.safeBatchTransferFrom(msg.sender, address(this), tokenIds, amounts, "");
    nft.setApprovalForAll(address(vault), true);
    vault.mintTo(tokenIds, amounts, address(xToken));
    uint256 newBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
    require(newBal == oldBal + count*BASE, "Incorrect vtokens minted");
    uint256 lockEndTime = block.timestamp + timelockTime;
    emit UserStaked(vaultId, tokenIds.length, 0, lockEndTime, msg.sender);
  }

  function addLiquidity721ETH(
    uint256 vaultId, 
    uint256[] calldata ids, 
    uint256 minWethIn
  ) external payable returns (uint256) {
    return addLiquidity721ETHTo(vaultId, ids, minWethIn, msg.sender);
  }

  function addLiquidity721ETHTo(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn,
    address to
  ) public payable nonReentrant returns (uint256) {
    require(to != address(0) && to != address(this));
    WETH.deposit{value: msg.value}();
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity721WETH(vaultId, ids, minWethIn, msg.value, to);

    // Return extras.
    uint256 remaining = msg.value-amountEth;
    if (remaining != 0) {
      WETH.withdraw(remaining);
      (bool success, ) = payable(to).call{value: remaining}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    }

    return liquidity;
  }

  function addLiquidity1155ETH(
    uint256 vaultId, 
    uint256[] calldata ids, 
    uint256[] calldata amounts,
    uint256 minEthIn
  ) external payable returns (uint256) {
    return addLiquidity1155ETHTo(vaultId, ids, amounts, minEthIn, msg.sender);
  }

  function addLiquidity1155ETHTo(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256[] memory amounts,
    uint256 minEthIn,
    address to
  ) public payable nonReentrant returns (uint256) {
    require(to != address(0) && to != address(this));
    WETH.deposit{value: msg.value}();
    // Finish this.
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity1155WETH(vaultId, ids, amounts, minEthIn, msg.value, to);

    // Return extras.
    uint256 remaining = msg.value-amountEth;
    if (remaining != 0) {
      WETH.withdraw(remaining);
      (bool success, ) = payable(to).call{value: remaining}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    }

    return liquidity;
  }

  function addLiquidity721(
    uint256 vaultId, 
    uint256[] calldata ids, 
    uint256 minWethIn,
    uint256 wethIn
  ) external returns (uint256) {
    return addLiquidity721To(vaultId, ids, minWethIn, wethIn, msg.sender);
  }

  function addLiquidity721To(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn,
    uint256 wethIn,
    address to
  ) public nonReentrant returns (uint256) {
    require(to != address(0) && to != address(this));
    IERC20Upgradeable(address(WETH)).safeTransferFrom(msg.sender, address(this), wethIn);
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity721WETH(vaultId, ids, minWethIn, wethIn, to);

    // Return extras.
    uint256 remaining = wethIn-amountEth;
    if (remaining != 0) {
      WETH.transfer(to, remaining);
    }

    return liquidity;
  }

  function addLiquidity1155(
    uint256 vaultId, 
    uint256[] memory ids,
    uint256[] memory amounts,
    uint256 minWethIn,
    uint256 wethIn
  ) public returns (uint256) {
    return addLiquidity1155To(vaultId, ids, amounts, minWethIn, wethIn, msg.sender);
  }

  function addLiquidity1155To(
    uint256 vaultId, 
    uint256[] memory ids,
    uint256[] memory amounts,
    uint256 minWethIn,
    uint256 wethIn,
    address to
  ) public nonReentrant returns (uint256) {
    require(to != address(0) && to != address(this));
    IERC20Upgradeable(address(WETH)).safeTransferFrom(msg.sender, address(this), wethIn);
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity1155WETH(vaultId, ids, amounts, minWethIn, wethIn, to);

    // Return extras.
    uint256 remaining = wethIn-amountEth; 
    if (remaining != 0) {
      WETH.transfer(to, remaining);
    }

    return liquidity;
  }

  function _addLiquidity721WETH(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn,
    uint256 wethIn,
    address to
  ) internal returns (uint256, uint256, uint256) {
    require(nftxFactory.excludedFromFees(address(this)));
    address vault = nftxFactory.vault(vaultId);

    // Transfer tokens to zap and mint to NFTX.
    address assetAddress = INFTXVault(vault).assetAddress();
    uint256 length = ids.length;
    for (uint256 i; i < length; i++) {
      transferFromERC721(assetAddress, ids[i], vault);
      approveERC721(assetAddress, vault, ids[i]);
    }
    uint256[] memory emptyIds;
    INFTXVault(vault).mint(ids, emptyIds);
    uint256 balance = length * BASE; // We should not be experiencing fees.
    
    return _addLiquidityAndLock(vaultId, vault, balance, minWethIn, wethIn, to);
  }

  function _addLiquidity1155WETH(
    uint256 vaultId, 
    uint256[] memory ids,
    uint256[] memory amounts,
    uint256 minWethIn,
    uint256 wethIn,
    address to
  ) internal returns (uint256, uint256, uint256) {
    require(nftxFactory.excludedFromFees(address(this)));
    address vault = nftxFactory.vault(vaultId);

    // Transfer tokens to zap and mint to NFTX.
    address assetAddress = INFTXVault(vault).assetAddress();
    IERC1155Upgradeable(assetAddress).safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");
    IERC1155Upgradeable(assetAddress).setApprovalForAll(vault, true);
    
    uint256 count = INFTXVault(vault).mint(ids, amounts);
    uint256 balance = (count * BASE); // We should not be experiencing fees.
    
    return _addLiquidityAndLock(vaultId, vault, balance, minWethIn, wethIn, to);
  }

  function _addLiquidityAndLock(
    uint256 vaultId, 
    address vault, 
    uint256 minTokenIn, 
    uint256 minWethIn, 
    uint256 wethIn,
    address to
  ) internal returns (uint256, uint256, uint256) {
    // Provide liquidity.
    IERC20Upgradeable(vault).safeApprove(address(sushiRouter), minTokenIn);
    (uint256 amountToken, uint256 amountEth, uint256 liquidity) = sushiRouter.addLiquidity(
      address(vault),
      address(WETH),
      minTokenIn,
      wethIn,
      minTokenIn,
      minWethIn,
      address(this),
      block.timestamp
    );

    // Stake in LP rewards contract 
    IERC20Upgradeable(pairFor(vault, address(WETH))).safeApprove(address(lpStaking), liquidity);
    uint256 timelockTime = isAddressTimelockExcluded(msg.sender, vaultId) ? 0 : lpLockTime;
    lpStaking.timelockDepositFor(vaultId, to, liquidity, timelockTime);
    
    uint256 remaining = minTokenIn-amountToken;
    if (remaining != 0) {
      IERC20Upgradeable(vault).safeTransfer(to, remaining);
    }

    uint256 lockEndTime = block.timestamp + timelockTime;
    emit UserStaked(vaultId, minTokenIn, liquidity, lockEndTime, to);
    return (amountToken, amountEth, liquidity);
  }

  function transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
    address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
    bytes memory data;
    if (assetAddr == kitties) {
        // Cryptokitties.
        data = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, to, tokenId);
    } else if (assetAddr == punks) {
        // CryptoPunks.
        // Fix here for frontrun attack. Added in v1.0.2.
        bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", tokenId);
        (bool checkSuccess, bytes memory result) = address(assetAddr).staticcall(punkIndexToAddress);
        (address nftOwner) = abi.decode(result, (address));
        require(checkSuccess && nftOwner == msg.sender, "Not the NFT owner");
        data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
    } else {
        // Default.
        // We push to the vault to avoid an unneeded transfer.
        data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", msg.sender, to, tokenId);
    }
    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }

  function approveERC721(address assetAddr, address to, uint256 tokenId) internal virtual {
    address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
    address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
    bytes memory data;
    if (assetAddr == kitties) {
        // Cryptokitties.
        // data = abi.encodeWithSignature("approve(address,uint256)", to, tokenId);
        // No longer needed to approve with pushing.
        return;
    } else if (assetAddr == punks) {
        // CryptoPunks.
        data = abi.encodeWithSignature("offerPunkForSaleToAddress(uint256,uint256,address)", tokenId, 0, to);
    } else {
      // No longer needed to approve with pushing.
      return;
    }
    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }

  // calculates the CREATE2 address for a pair without making any external calls
  function pairFor(address tokenA, address tokenB) internal view returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(uint160(uint256(keccak256(abi.encodePacked(
      hex'ff',
      sushiRouter.factory(),
      keccak256(abi.encodePacked(token0, token1)),
      hex'e18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303' // init code hash
    )))));
  }

  // returns sorted token addresses, used to handle return values from pairs sorted in this order
  function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
      require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
      (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
      require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
  }

  receive() external payable {
    require(msg.sender == address(WETH), "Only WETH");
  }

  function rescue(address token) external onlyOwner {
    if (token == address(0)) {
      (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    } else {
      IERC20Upgradeable(token).safeTransfer(msg.sender, IERC20Upgradeable(token).balanceOf(address(this)));
    }
  }
}
