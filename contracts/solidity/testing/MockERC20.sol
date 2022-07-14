// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20Upgradeable.sol";


contract MockERC20 is ERC20Upgradeable {

    /**
     * @dev See {IERC165-supportsInterface}.
     */

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

}