// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXInventoryStaking.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/IUniswapV2Router01.sol";
import "./util/Ownable.sol";
import "./util/ReentrancyGuard.sol";
import "./util/SafeERC20Upgradeable.sol";


/**
 * @notice A partial WETH interface.
 */

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
  function balanceOf(address to) external view returns (uint256);
  function approve(address guy, uint wad) external returns (bool);
}


/**
 * @notice Allows users to buy and stake tokens into either an inventory or liquidity
 * pool, handling the steps between buying and staking across 0x and sushi.
 * 
 * @author Twade
 */

contract NFTXYieldStakingZap is Ownable, ReentrancyGuard {

  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  /// @notice Allows zap to be paused
  bool public paused = false;

  /// @notice Sets our 0x swap target
  address payable private immutable swapTarget;
 
  /// @notice Holds the mapping of our sushi router
  IUniswapV2Router01 public immutable sushiRouter;

  /// @notice An interface for the WETH contract
  IWETH public immutable WETH;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXInventoryStaking public immutable inventoryStaking;
  INFTXLPStaking public immutable lpStaking;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable nftxFactory;

  /// @notice A mapping of NFTX Vault IDs to their address corresponding
  /// vault contract address
  mapping(uint256 => address) public nftxVaultAddresses;


  /**
   * @notice Initialises our zap and sets our internal addresses that will be referenced
   * in our contract. This allows for varied addresses based on the network.
   */

  constructor(
    address _nftxFactory,
    address _inventoryStaking,
    address _lpStaking,
    address _sushiRouter,
    address _weth,
    address payable _swapTarget
  ) Ownable() ReentrancyGuard() {
    // Set our staking contracts
    inventoryStaking = INFTXInventoryStaking(_inventoryStaking);
    lpStaking = INFTXLPStaking(_lpStaking);

    // Set our NFTX factory contract
    nftxFactory = INFTXVaultFactory(_nftxFactory);

    // Set our Sushi Router used for liquidity
    sushiRouter = IUniswapV2Router01(_sushiRouter);

    // Set our chain's WETH contract
    WETH = IWETH(_weth);
    // setting infinite approval here to save on subsequent gas costs
    WETH.approve(_sushiRouter, type(uint256).max);
    WETH.approve(_swapTarget, type(uint256).max);

    // Set our 0x Swap Target
    swapTarget = _swapTarget;
  }


  /**
   * @notice Allows the user to buy and stake tokens against an Inventory. This will
   * handle the purchase of the vault tokens against 0x and then generate the xToken
   * against the vault and timelock them.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param swapCallData The `data` field from the 0x API response
   */

  function buyAndStakeInventory(
    uint256 vaultId,
    bytes calldata swapCallData
  ) external payable nonReentrant onlyOwnerIfPaused {
    // Ensure we have tx value
    require(msg.value > 0, 'Invalid value provided');

    // Get our vaults base staking token. This is used to calculate the xToken
    address baseToken = _vaultAddress(vaultId);
    require(baseToken != address(0), 'Invalid vault provided');
    
    // Get our start WETH balance
    uint wethBalance = WETH.balanceOf(address(this));

    // Wrap ETH into WETH for our contract from the sender
    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    // Convert WETH to vault token
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapCallData);

    // Make a direct timelock mint using the default timelock duration. This sends directly
    // to our user, rather than via the zap, to avoid the timelock locking the tx.
    IERC20Upgradeable(baseToken).transfer(inventoryStaking.vaultXToken(vaultId), vaultTokenAmount);
    inventoryStaking.timelockMintFor(vaultId, vaultTokenAmount, msg.sender, 2);

    // Return any left of WETH to the user as ETH
    uint256 remainingWETH = WETH.balanceOf(address(this)) - wethBalance;
    if (remainingWETH > 0) {
      // Unwrap our WETH into ETH and transfer it to the recipient
      WETH.withdraw(remainingWETH);
      (bool success, ) = payable(msg.sender).call{value: remainingWETH}("");
      require(success, "Unable to send unwrapped WETH");
    }
  }


  /**
   * @notice Allows the user to buy and stake tokens against a Liquidity pool. This will
   * handle the purchase of the vault tokens against 0x, the liquidity pool supplying via
   * sushi and then the timelocking against our LP token.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param swapCallData The `data` field from the 0x API response
   * @param minTokenIn The minimum amount of token to LP
   * @param minWethIn The minimum amount of ETH (WETH) to LP
   * @param wethIn The amount of ETH (WETH) supplied
   */

  function buyAndStakeLiquidity(
    // Base data
    uint256 vaultId,

    // 0x integration
    bytes calldata swapCallData,

    // Sushiswap integration
    uint256 minTokenIn,
    uint256 minWethIn,
    uint256 wethIn

  ) external payable nonReentrant onlyOwnerIfPaused {
    // Ensure we have tx value
    require(msg.value > 0, 'Invalid value provided');
    require(msg.value > wethIn, 'Insufficient vault sent for pairing');

    // Get our start WETH balance
    uint wethBalance = WETH.balanceOf(address(this));

    // Wrap ETH into WETH for our contract from the sender
    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    // Get our vaults base staking token. This is used to calculate the xToken
    address baseToken = _vaultAddress(vaultId);
    require(baseToken != address(0), 'Invalid vault provided');

    // Convert WETH to vault token
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapCallData);
    require(vaultTokenAmount > minTokenIn, 'Insufficient tokens acquired');

    // Check WETH balance
    uint256 WETHAmount = WETH.balanceOf(address(this)) - wethBalance;
    require(WETHAmount >= wethIn, 'Insufficient WETH remaining');

    // Provide liquidity to sushiswap, using the vault token that we acquired from 0x and
    // pairing it with the liquidity amount specified in the call.
    IERC20Upgradeable(baseToken).safeApprove(address(sushiRouter), vaultTokenAmount);
    (uint256 amountToken, , uint256 liquidity) = sushiRouter.addLiquidity(
      baseToken,
      address(WETH),
      vaultTokenAmount,
      wethIn,
      minTokenIn,
      minWethIn,
      address(this),
      block.timestamp
    );

    // Stake in LP rewards contract 
    address lpToken = pairFor(baseToken, address(WETH));
    IERC20Upgradeable(lpToken).safeApprove(address(lpStaking), liquidity);
    lpStaking.timelockDepositFor(vaultId, msg.sender, liquidity, 48 hours);
    
    // Return any token dust to the caller
    uint256 remainingTokens = vaultTokenAmount - amountToken;
    if (remainingTokens != 0) {
      IERC20Upgradeable(baseToken).transfer(msg.sender, remainingTokens);
    }

    // Return any left of WETH to the user as ETH
    uint256 remainingWETH = WETH.balanceOf(address(this)) - wethBalance;
    if (remainingWETH > 0) {
      // Unwrap our WETH into ETH and transfer it to the recipient
      WETH.withdraw(remainingWETH);
      (bool success, ) = payable(msg.sender).call{value: remainingWETH}("");
      require(success, "Unable to send unwrapped WETH");
    }
  }


  /**
   * @notice Calculates the CREATE2 address for a sushi pair without making any
   * external calls.
   * 
   * @return pair Address of our token pair
   */

  function pairFor(address tokenA, address tokenB) internal view returns (address pair) {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(uint160(uint256(keccak256(abi.encodePacked(
      hex'ff',
      sushiRouter.factory(),
      keccak256(abi.encodePacked(token0, token1)),
      hex'e18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303' // init code hash
    )))));
  }


  /**
   * @notice Returns sorted token addresses, used to handle return values from pairs sorted in
   * this order.
   */

  function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
      require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
      (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
      require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
  }


  /**
   * @notice Allows our owner to withdraw and tokens in the contract.
   * 
   * @param token The address of the token to be rescued
   */

  function rescue(address token) external onlyOwner {
    if (token == address(0)) {
      (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
      require(success, "Address: unable to send value");
    } else {
      IERC20Upgradeable(token).safeTransfer(msg.sender, IERC20Upgradeable(token).balanceOf(address(this)));
    }
  }


  /**
   * @notice Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.
   *
   * @param buyToken The `buyTokenAddress` field from the API response
   * @param swapCallData The `data` field from the API response
   */

  function _fillQuote(
    address buyToken,
    bytes calldata swapCallData
  ) internal returns (uint256) {
      // Track our balance of the buyToken to determine how much we've bought.
      uint256 boughtAmount = IERC20Upgradeable(buyToken).balanceOf(address(this));

      // Call the encoded swap function call on the contract at `swapTarget`
      (bool success,) = swapTarget.call(swapCallData);
      require(success, 'SWAP_CALL_FAILED');

      // Use our current buyToken balance to determine how much we've bought.
      return IERC20Upgradeable(buyToken).balanceOf(address(this)) - boughtAmount;
  }


  /**
   * @notice Maps a cached NFTX vault address against a vault ID for gas savings on
   * repeat vault address lookups.
   * 
   * @param vaultId The ID of the NFTX vault
   */

  function _vaultAddress(uint256 vaultId) internal returns (address) {
    if (nftxVaultAddresses[vaultId] == address(0)) {
      nftxVaultAddresses[vaultId] = nftxFactory.vault(vaultId);
    }

    require(nftxVaultAddresses[vaultId] != address(0), 'Vault does not exist');
    return nftxVaultAddresses[vaultId];
  }


  /**
   * @notice Allows our zap to be paused to prevent any processing.
   * 
   * @param _paused New pause state
   */

  function pause(bool _paused) external onlyOwner {
    paused = _paused;
  }

  /**
   * @notice A modifier that only allows the owner to interact with the function
   * if the contract is paused. If the contract is not paused then anyone can
   * interact with the function.
   */

  modifier onlyOwnerIfPaused() {
    require(!paused || msg.sender == owner(), "Zap is paused");
    _;
  }


  /**
   * @notice Allows our contract to only receive WETH and reject everything else.
   */

  receive() external payable {
    require(msg.sender == address(WETH), "Only WETH");
  }

}
