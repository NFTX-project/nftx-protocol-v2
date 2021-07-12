// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/IUniswapV2Router01.sol";
import "./token/IERC721Upgradeable.sol";
import "./token/IERC1155Upgradeable.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/ERC721HolderUpgradeable.sol";
import "./token/ERC1155HolderUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";

// Authors: @0xKiwi_.

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
}

contract NFTXStakingZap is OwnableUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
  IWETH public WETH; 
  INFTXLPStaking public lpStaking;
  INFTXVaultFactory public nftxFactory;
  IUniswapV2Router01 public sushiRouter;

  uint256 public lockTime = 48 hours; 

  mapping(uint256 => mapping(address => uint256)) private zapLock;
  mapping(uint256 => mapping(address => uint256)) private lockedBalance;

  uint256 BASE = 10**18;

  event UserStaked(uint256 vaultId, uint256 count, uint256 lpBalance, uint256 timelockUntil);
  event Withdraw(uint256 vaultId, uint256 lpBalance);

  constructor(address _nftxFactory, address _sushiRouter) {
    __Ownable_init();
    nftxFactory = INFTXVaultFactory(_nftxFactory);
    sushiRouter = IUniswapV2Router01(_sushiRouter);
    WETH = IWETH(sushiRouter.WETH());
    IERC20Upgradeable(address(WETH)).approve(address(sushiRouter), type(uint256).max);
  }

  function setLpStakingAddress(address newLpStaking) external {
    lpStaking = INFTXLPStaking(newLpStaking);
  } 

  function addLiquidity721ETH(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn
  ) public payable returns (uint256) {
    WETH.deposit{value: msg.value}();
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity721WETH(vaultId, ids, minWethIn, msg.value);

    // Return extras.
    if (amountEth < msg.value) {
      WETH.withdraw(msg.value-amountEth);
      payable(msg.sender).transfer(msg.value-amountEth);
    }

    return liquidity;
  }

  function addLiquidity1155ETH(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256[] memory amounts,
    uint256 minEthIn
  ) public payable returns (uint256) {
    WETH.deposit{value: msg.value}();
    // Finish this.
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity1155WETH(vaultId, ids, amounts, minEthIn, msg.value);

    // Return extras.
    if (amountEth < msg.value) {
      WETH.withdraw(msg.value-amountEth);
      payable(msg.sender).transfer(msg.value-amountEth);
    }

    return liquidity;
  }

  function _addLiquidity721(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn,
    uint256 wethIn
  ) public returns (uint256) {
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity721WETH(vaultId, ids, minWethIn, wethIn);

    // Return extras.
    if (amountEth < wethIn) {
      WETH.transfer(msg.sender, wethIn-amountEth);
    }

    return liquidity;
  }

  function _addLiquidity1155(
    uint256 vaultId, 
    uint256[] memory ids,
    uint256[] memory amounts,
    uint256 minWethIn,
    uint256 wethIn
  ) internal returns (uint256) {
    (, uint256 amountEth, uint256 liquidity) = _addLiquidity1155WETH(vaultId, ids, amounts, minWethIn, wethIn);

    // Return extras.
    if (amountEth < wethIn) {
      WETH.transfer(msg.sender, wethIn-amountEth);
    }

    return liquidity;
  }

  function withdrawXLPTokens(uint256 vaultId) public {
    uint256 lockedBal = lockedBalance[vaultId][msg.sender];
    require(block.timestamp >= zapLock[vaultId][msg.sender], "NFTXZap: Locked");
    require(lockedBal > 0, "NFTXZap: Nothing locked");
    
    zapLock[vaultId][msg.sender] = 0;
    lockedBalance[vaultId][msg.sender] = 0;

    address xLPtoken = lpStaking.rewardDistributionToken(vaultId);
    IERC20Upgradeable(xLPtoken).transfer(msg.sender, lockedBal);

    emit Withdraw(vaultId, lockedBal);
  }

  function setLockTime(uint256 newLockTime) external onlyOwner {
    lockTime = newLockTime;
  } 

  function lockedUntil(uint256 vaultId, address who) external view returns (uint256) {
    return zapLock[vaultId][who];
  }

  function lockedLPBalance(uint256 vaultId, address who) external view returns (uint256) {
    return lockedBalance[vaultId][who];
  }

  function _addLiquidity721WETH(
    uint256 vaultId, 
    uint256[] memory ids, 
    uint256 minWethIn,
    uint256 wethIn
  ) internal returns (uint256, uint256, uint256) {
    address vault = nftxFactory.vault(vaultId);
    require(vault != address(0), "NFTXZap: Vault does not exist");

    // Transfer tokens to zap and mint to NFTX.
    address assetAddress = INFTXVault(vault).assetAddress();
    for (uint256 i = 0; i < ids.length; i++) {
      transferFromERC721(assetAddress, ids[i]);
      approveERC721(assetAddress, vault, ids[i]);
    }
    uint256[] memory emptyIds;
    uint256 count = INFTXVault(vault).mint(ids, emptyIds);
    uint256 balance = (count * BASE); // We should not be experiencing fees.
    require(balance == IERC20Upgradeable(vault).balanceOf(address(this)), "Did not receive expected balance");
    
    return _addLiquidityAndLock(vaultId, vault, balance, minWethIn, wethIn);
  }

  function _addLiquidity1155WETH(
    uint256 vaultId, 
    uint256[] memory ids,
    uint256[] memory amounts,
    uint256 minWethIn,
    uint256 wethIn
  ) internal returns (uint256, uint256, uint256) {
    address vault = nftxFactory.vault(vaultId);
    require(vault != address(0), "NFTXZap: Vault does not exist");

    // Transfer tokens to zap and mint to NFTX.
    address assetAddress = INFTXVault(vault).assetAddress();
    IERC1155Upgradeable(assetAddress).safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");
    IERC1155Upgradeable(assetAddress).setApprovalForAll(vault, true);
    uint256 count = INFTXVault(vault).mint(ids, amounts);
    uint256 balance = (count * BASE); // We should not be experiencing fees.
    require(balance == IERC20Upgradeable(vault).balanceOf(address(this)), "Did not receive expected balance");
    
    return _addLiquidityAndLock(vaultId, vault, balance, minWethIn, wethIn);
  }

  function _addLiquidityAndLock(
    uint256 vaultId, 
    address vault, 
    uint256 minTokenIn, 
    uint256 minWethIn, 
    uint256 wethIn
  ) internal returns (uint256, uint256, uint256) {
    // Provide liquidity.
    IERC20Upgradeable(vault).approve(address(sushiRouter), minTokenIn);
    (uint256 amountToken, uint256 amountEth, uint256 liquidity) = sushiRouter.addLiquidity(
      address(vault), 
      sushiRouter.WETH(),
      minTokenIn, 
      wethIn, 
      minTokenIn,
      minWethIn,
      address(this), 
      block.timestamp
    );

    // Stake in LP rewards contract 
    address lpToken = pairFor(vault, address(WETH));
    IERC20Upgradeable(lpToken).approve(address(lpStaking), liquidity);
    lpStaking.depositFor(vaultId, liquidity, msg.sender);
    
    lockedBalance[vaultId][msg.sender] += liquidity;
    uint256 lockTime = block.timestamp + lockTime;
    zapLock[vaultId][msg.sender] = lockTime;

    if (amountToken < minTokenIn) {
      IERC20Upgradeable(vault).transfer(msg.sender, minTokenIn-amountToken);
    }

    emit UserStaked(vaultId, minTokenIn, liquidity, lockTime);
    return (amountToken, amountEth, liquidity);
  }

  function transferFromERC721(address assetAddr, uint256 tokenId) internal virtual {
    address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
    address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
    bytes memory data;
    if (assetAddr == kitties) {
        // Cryptokitties.
        data = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), tokenId);
    } else if (assetAddr == punks) {
        // CryptoPunks.
        // Fix here for frontrun attack. Added in v1.0.2.
        bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", tokenId);
        (bool checkSuccess, bytes memory result) = address(assetAddr).staticcall(punkIndexToAddress);
        (address owner) = abi.decode(result, (address));
        require(checkSuccess && owner == msg.sender, "Not the owner");
        data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
    } else {
        // Default.
        data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", msg.sender, address(this), tokenId);
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
        data = abi.encodeWithSignature("approve(address,uint256)", to, tokenId);
    } else if (assetAddr == punks) {
        // CryptoPunks.
        data = abi.encodeWithSignature("offerPunkForSaleToAddress(uint256,uint256,address)", tokenId, 0, to);
    } else {
        if (IERC721Upgradeable(assetAddr).isApprovedForAll(address(this), to)) {
          return;
        }
        // Default.
        data = abi.encodeWithSignature("setApprovalForAll(address,bool)", to, true);
    }
    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }

  // calculates the CREATE2 address for a pair without making any external calls
  function pairFor(address tokenA, address tokenB) internal pure returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(uint160(uint256(keccak256(abi.encodePacked(
      hex'ff',
      0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac,
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
}
