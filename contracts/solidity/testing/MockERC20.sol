// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20Upgradeable.sol";


contract MockERC20 is ERC20Upgradeable {

    constructor(string memory name_, string memory symbol_) {
        __ERC20_init(name_, symbol_);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    fallback () external payable {
        //
    }

} 