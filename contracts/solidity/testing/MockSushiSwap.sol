// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


contract MockSushiSwap {

	function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
		amountA = amountADesired;
		amountB = amountBDesired;
		liquidity = (amountADesired * amountBDesired) / 1e18;
	}

    function factory() external returns (address) {
        return address(this);
    }
}
