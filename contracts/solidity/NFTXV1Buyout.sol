// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./token/IERC20Upgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol"; 
import "./util/PausableUpgradeable.sol"; 

interface IV1Token is IERC20Upgradeable {
  function burnFrom(address account, uint256 amount) external;
}

contract NFTXV1Buyout is PausableUpgradeable, ReentrancyGuardUpgradeable { 
  uint256 constant BASE = 10*18;
  mapping(address => uint256) public ethAvailable;

  event TokenBuyout(address tokenAddress, uint256 totalEth);
  event BuyoutComplete(address tokenAddress);

  function __NFTXV1Buyout_init() external initializer {
    __Pausable_init();
    __ReentrancyGuard_init();
  }

  // Emergency functions.
  function emergencyWithdraw() external onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }

  function clearBuyout(address v1TokenAddr) external onlyOwner {
    ethAvailable[v1TokenAddr] = 0;
    emit BuyoutComplete(v1TokenAddr);
  }

  function addBuyout(address v1TokenAddr) external payable onlyOwner {
    require(msg.value > 0, "Cannot pair with 0 ETH");
    ethAvailable[v1TokenAddr] += msg.value;

    emit TokenBuyout(v1TokenAddr, msg.value);
  }

  function removeBuyout(address v1TokenAddr) external onlyOwner {
    uint256 amount = ethAvailable[v1TokenAddr];
    require(amount > 0, "Cannot remove 0");
    ethAvailable[v1TokenAddr] = 0;
    sendValue(payable(msg.sender), amount);
    emit BuyoutComplete(v1TokenAddr);
  }

  function claimETH(address v1TokenAddr) external nonReentrant {
    onlyOwnerIfPaused(0);
    uint256 ethAvail = ethAvailable[v1TokenAddr];
    require(ethAvail > 0, "Not a valid buyout token");

    uint256 userBal = IV1Token(v1TokenAddr).balanceOf(msg.sender);
    require(userBal > 0, "cant be zero");
    uint256 totalSupply = IV1Token(v1TokenAddr).totalSupply();
    IV1Token(v1TokenAddr).burnFrom(msg.sender, userBal);
    uint256 ethToSend = (ethAvail * userBal)/totalSupply;
    ethToSend = ethToSend > ethAvail ? ethAvail : ethToSend;
    ethAvailable[v1TokenAddr] -= ethToSend;
    (bool success, ) = msg.sender.call{ value: ethToSend }("");
    require(success, "Address: unable to send value, recipient may have reverted");

    if (ethAvailable[v1TokenAddr] == 0) {
      emit BuyoutComplete(v1TokenAddr);
    }
  }

  function sendValue(address payable recipient, uint256 amount) internal {
    require(address(this).balance >= amount, "Address: insufficient balance");

    // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
    (bool success, ) = recipient.call{ value: amount }("");
    require(success, "Address: unable to send value, recipient may have reverted");
  }
}
