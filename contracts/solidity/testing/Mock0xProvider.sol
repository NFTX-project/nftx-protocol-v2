// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/IERC20Upgradeable.sol";

import "hardhat/console.sol";


contract Mock0xProvider {

  uint256 private payInAmount;
  uint256 private payOutAmount;

  constructor() {}

  function setPayInAmount(uint256 _amount) external {
    payInAmount = _amount;
  }

  function setPayOutAmount(uint256 _amount) external {
    payOutAmount = _amount;
  }

  function transfer(address spender, address tokenIn, address tokenOut) external payable returns (bool, bytes memory) {
    // Transfer the input token in
    IERC20Upgradeable(tokenIn).transferFrom(msg.sender, address(this), payInAmount);

    // Transfer the payment token out
    IERC20Upgradeable(tokenOut).transfer(spender, payOutAmount);

    // Return success and empty bytes data
    return (true, hex'');
  }

}
