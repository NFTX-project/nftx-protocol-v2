// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXInventoryStaking.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/IRewardDistributionToken.sol";
import "./token/XTokenUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";


/**
 * @notice A partial WETH interface.
 */

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
  function balanceOf(address to) external view returns (uint256);
}


/**
 * @notice 
 * 
 * @author Twade
 */

contract NFTXYieldStakingZap is OwnableUpgradeable, ReentrancyGuardUpgradeable {

  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  /// @notice An interface for the WETH contract
  IWETH public immutable WETH;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXInventoryStaking public immutable inventoryStaking;
  INFTXLPStaking public immutable lpStaking;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable nftxFactory;

  /// @notice A mapping of NFTX Vault IDs to their address corresponding vault contract address
  mapping(uint256 => address) public nftxVaultAddresses;


  /**
   * @notice Initialises our zap.
   */

  constructor(address _nftxFactory, address _inventoryStaking, address _lpStaking, address _weth) {
    // Set our staking contracts
    inventoryStaking = INFTXInventoryStaking(_inventoryStaking);
    lpStaking = INFTXLPStaking(_lpStaking);

    // Set our NFTX factory contract
    nftxFactory = INFTXVaultFactory(_nftxFactory);

    // Set our chain's WETH contract
    WETH = IWETH(_weth);
  }


  /**
   * @notice ..
   */

  function buyAndStakeInventory(
    uint256 vaultId,
    address payable swapTarget,
    bytes calldata swapCallData
  ) external payable nonReentrant {
    // Ensure we have tx value
    require(msg.value > 0);

    // Wrap ETH into WETH for our contract from the sender
    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    // Get our vaults base staking token. This is used to calculate the xToken
    address baseToken = _vaultAddress(vaultId);

    // Convert WETH to vault token
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapTarget, swapCallData);

    // Get the starting balance of xTokens
    XTokenUpgradeable xToken = XTokenUpgradeable(inventoryStaking.xTokenAddr(baseToken));
    uint256 xTokenBalance = xToken.balanceOf(address(this));

    // Deposit vault token and receive xToken into the zap
    inventoryStaking.deposit(vaultId, vaultTokenAmount);

    // transfer xToken to caller
    xToken.transferFrom(
      address(this),
      msg.sender,
      xToken.balanceOf(address(this)) - xTokenBalance
    );
  }


  /**
   * @notice ..
   */

  function buyAndStakeLiquidity(
    uint256 vaultId,
    address payable swapTarget,
    bytes calldata swapCallData
  ) external payable nonReentrant {
    // Ensure we have tx value
    require(msg.value > 0);

    // Wrap ETH into WETH for our contract from the sender
    if (msg.value > 0) {
      WETH.deposit{value: msg.value}();
    }

    // Get our vaults base staking token. This is used to calculate the xToken
    address baseToken = _vaultAddress(vaultId);

    // Convert WETH to vault token
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapTarget, swapCallData);

    // Check that we have a liquidity pool for our vault
    address stakingToken = lpStaking.stakingToken(baseToken);
    require(stakingToken != address(0), "LPStaking: Nonexistent pool");

    // Get the starting balance of xTokens
    IERC20Upgradeable xToken = IERC20Upgradeable(lpStaking.rewardDistributionToken(vaultId));
    uint256 xTokenBalance = xToken.balanceOf(address(this));

    // Deposit vault token and receive xToken into the zap
    lpStaking.deposit(vaultId, vaultTokenAmount);

    // transfer xToken to caller
    xToken.transferFrom(
      address(this),
      msg.sender,
      xToken.balanceOf(address(this)) - xTokenBalance
    );
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
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   */

  function _fillQuote(
    address buyToken,
    address payable swapTarget,
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
   * @notice Maps a cached NFTX vault address against a vault ID.
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
   * @notice Allows our contract to receive any assets.
   */

  receive() external payable {
    //
  }

}
