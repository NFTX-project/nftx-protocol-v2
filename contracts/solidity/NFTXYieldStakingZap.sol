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
    require(msg.value > 0, 'Invalid value provided');

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
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapTarget, swapCallData);

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
   * @notice ..
   */

  function buyAndStakeLiquidity(
    uint256 vaultId,
    address payable swapTarget,
    bytes calldata swapCallData
  ) external payable nonReentrant {
    // Ensure we have tx value
    require(msg.value > 0, 'Invalid value provided');

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
    uint256 vaultTokenAmount = _fillQuote(baseToken, swapTarget, swapCallData);

    // Allow our filled base token to be handled by our inventory stake
    require(
      IERC20Upgradeable(baseToken).approve(address(lpStaking), vaultTokenAmount),
      'Unable to approve contract'
    );

    // Deposit vault token and send our xtoken to the sender
    lpStaking.timelockDepositFor(vaultId, msg.sender, vaultTokenAmount, 2);

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

      // Give `swapTarget` an infinite allowance to spend this contract's `sellToken`.
      // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
      // allowance to 0 before being able to update it.
      require(IERC20Upgradeable(address(WETH)).approve(swapTarget, type(uint256).max), 'Unable to approve contract');

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
