pragma solidity ^0.8.0;

import "./token/IERC20Upgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol"; 
import "./util/OwnableUpgradeable.sol"; 

interface IV1Token is IERC20Upgradeable {
  function burnFrom(address account, uint256 amount) external;
}

contract NFTXV1Buyout is OwnableUpgradeable, ReentrancyGuardUpgradeable { 
  uint256 constant BASE = 10*18;
  mapping(address => uint256) public ethAvailiable;

  function addBuyout(address v1TokenAddr) external payable onlyOwner {
    require(msg.value > 0, "Cannot pair with 0 ETH");
    ethAvailiable[v1TokenAddr] = msg.value;
  }

  function claimETH(address v1TokenAddr) external nonReentrant {
    uint256 ethAvail = ethAvailiable[v1TokenAddr];
    require(ethAvail > 0, "Not a valid buyout token");

    uint256 userBal = IV1Token(v1TokenAddr).balanceOf(msg.sender);
    uint256 totalSupply = IV1Token(v1TokenAddr).totalSupply();
    IV1Token(v1TokenAddr).burnFrom(msg.sender, userBal);
    uint256 ethToSend = ethAvail * ((userBal * BASE)/ totalSupply) / BASE;
    ethToSend = ethToSend > ethAvail ? ethAvail : ethToSend;
    msg.sender.call{value: ethToSend};
  }
}