// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/IUniswapV2Router01.sol";
import "./token/IERC1155Upgradeable.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/ERC721HolderUpgradeable.sol";
import "./token/ERC1155HolderUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";


// Authors: @tomwade

// A partial ERC20 interface.
interface IERC20 {
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

// A partial WETH interfaec.
interface IWETH is IERC20 {
    function deposit() external payable;
}


contract NFTXMarketplaceZap is OwnableUpgradeable, ReentrancyGuardUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  IWETH public immutable WETH;

  uint256 constant BASE = 1e18;

  event BoughtTokens(IERC20 sellToken, IERC20 buyToken, uint256 boughtAmount);

  constructor(IWETH weth) Ownable() ReentrancyGuard() {
      WETH = weth;
      owner = msg.sender;
  }

    // Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.
    function fillQuote(
        // The `sellTokenAddress` field from the API response.
        IERC20 sellToken,
        // The `buyTokenAddress` field from the API response.
        IERC20 buyToken,
        // The `allowanceTarget` field from the API response.
        address spender,
        // The `to` field from the API response.
        address payable swapTarget,
        // The `data` field from the API response.
        bytes calldata swapCallData
    )
        external
        onlyOwner
        payable // Must attach ETH equal to the `value` field from the API response.
    {
        // Track our balance of the buyToken to determine how much we've bought.
        uint256 boughtAmount = buyToken.balanceOf(address(this));

        // Give `spender` an infinite allowance to spend this contract's `sellToken`.
        // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
        // allowance to 0 before being able to update it.
        require(sellToken.approve(spender, uint256(-1)));
        // Call the encoded swap function call on the contract at `swapTarget`,
        // passing along any ETH attached to this function call to cover protocol fees.
        (bool success,) = swapTarget.call{value: msg.value}(swapCallData);
        require(success, 'SWAP_CALL_FAILED');
        // Refund any unspent protocol fees to the sender.
        msg.sender.transfer(address(this).balance);

        // Use our current buyToken balance to determine how much we've bought.
        boughtAmount = buyToken.balanceOf(address(this)) - boughtAmount;
        emit BoughtTokens(sellToken, buyToken, boughtAmount);
    }

  function rescue(address token) external onlyOwner {
    if (token == address(0)) {
      (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    } else {
      IERC20Upgradeable(token).safeTransfer(msg.sender, IERC20Upgradeable(token).balanceOf(address(this)));
    }
  }

  receive() external payable {
    require(msg.sender == address(WETH), "Only WETH");
  }
}
