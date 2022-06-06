// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./token/IERC20Upgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol"; 
import "./util/PausableUpgradeable.sol"; 


/**
 * @title NFTX Inventory Staking
 * @author The NFTX Team.
 * 
 * @notice TODO
 */

interface IV1Token is IERC20Upgradeable {
  function burnFrom(address account, uint256 amount) external;
}


/**
 * @title NFTX Buyout
 * @author The NFTX Team.
 * 
 * @notice TODO
 */

contract NFTXV1Buyout is PausableUpgradeable, ReentrancyGuardUpgradeable {

  /// @notice TODO
  uint256 constant BASE = 10*18;

  /// @notice TODO
  mapping(address => uint256) public ethAvailiable;

  /// @notice TODO
  /// @param tokenAddress 
  /// @param totalEth 
  event TokenBuyout(address tokenAddress, uint256 totalEth);

  /// @notice TODO
  /// @param tokenAddress
  event BuyoutComplete(address tokenAddress);


  /**
   * @notice Initialises the contract.
   * 
   * @dev Allows for upgradable deployment
   */

  function __NFTXV1Buyout_init() external initializer {
    __Pausable_init();
    __ReentrancyGuard_init();
  }


  /**
   * @notice Allows the owner to withdraw the entirity of the ETH balance to their
   * wallet.
   * 
   * @dev This is not a safe transfer, so the owner's address must be capable of
   * receiving.
   */

  function emergencyWithdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }


  /**
   * @notice Removes the ETH available allocation against a token address, setting it
   * to zero and marking the buyout as complete. The sender will not receive any of the
   * stored ETH against the mapping.
   *
   * @param v1TokenAddr TODO
   */

  function clearBuyout(address v1TokenAddr) external onlyOwner {
    ethAvailiable[v1TokenAddr] = 0;
    emit BuyoutComplete(v1TokenAddr);
  }


  /**
   * @notice Receives ETH from the sender and increments it against the provided address.
   * 
   * @dev SafeMath is not implemented in this function, so is open to overflow.
   *
   * @param v1TokenAddr TODO
   */

  function addBuyout(address v1TokenAddr) external payable onlyOwner {
    require(msg.value > 0, "Cannot pair with 0 ETH");
    ethAvailiable[v1TokenAddr] += msg.value;

    emit TokenBuyout(v1TokenAddr, msg.value);
  }


  /**
   * @notice Removes the full ETH available allocation against a token address, setting
   * it to zero and marking the buyout as complete. The sender will receive the ETH
   * allocation stored in the contract against the token address.
   *
   * @param v1TokenAddr TODO
   */

  function removeBuyout(address v1TokenAddr) external onlyOwner {
    uint256 amount = ethAvailiable[v1TokenAddr];
    require(amount > 0, "Cannot remove 0");
    ethAvailiable[v1TokenAddr] = 0;
    sendValue(payable(msg.sender), amount);
    emit BuyoutComplete(v1TokenAddr);
  }


  /**
   * @notice Burns V1 tokens from the sender and sends ETH from the contract to
   * the sender in return. The value of the ETH is calculated based on the remaining
   * supply of the V1 token and the amount of ETH available in the token mapping.
   * 
   * It is only possible for the entirity of the V1 token to be exchanged, and not
   * a partial amount.
   * 
   * @dev The function may only be called by the contract owner if paused.
   * @dev SafeMath is not implemented, so under and overflow will need to be
   * considered prior to call.
   *
   * @param v1TokenAddr TODO
   */

  function claimETH(address v1TokenAddr) external nonReentrant {
    onlyOwnerIfPaused(0);
    uint256 ethAvail = ethAvailiable[v1TokenAddr];
    require(ethAvail > 0, "Not a valid buyout token");

    uint256 userBal = IV1Token(v1TokenAddr).balanceOf(msg.sender);
    require(userBal > 0, "cant be zero");
    uint256 totalSupply = IV1Token(v1TokenAddr).totalSupply();
    IV1Token(v1TokenAddr).burnFrom(msg.sender, userBal);
    uint256 ethToSend = (ethAvail * userBal)/totalSupply;
    ethToSend = ethToSend > ethAvail ? ethAvail : ethToSend;
    ethAvailiable[v1TokenAddr] -= ethToSend;
    (bool success, ) = msg.sender.call{ value: ethToSend }("");
    require(success, "Address: unable to send value, recipient may have reverted");

    if (ethAvailiable[v1TokenAddr] == 0) {
      emit BuyoutComplete(v1TokenAddr);
    }
  }


  /**
   * @notice Sends ETH stored in the contract to a specific recipient address.
   *
   * @param recipient Address that will receive ETH
   * @param amount Amount of ETH to be sent
   */

  function sendValue(address payable recipient, uint256 amount) internal {
    require(address(this).balance >= amount, "Address: insufficient balance");

    // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
    (bool success, ) = recipient.call{ value: amount }("");
    require(success, "Address: unable to send value, recipient may have reverted");
  }
}
