// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IERC20Upgradeable.sol";
import "./ERC20Upgradeable.sol";
import "../util/OwnableUpgradeable.sol";
// import "../interface/INFTXVaultFactory.sol";

// interface INFTXInventoryStaking {
//     function nftxVaultFactory() external view returns (INFTXVaultFactory);
// }

// SushiBar is the coolest bar in town. You come in with some Sushi, and leave with more! The longer you stay, the more Sushi you get.
//
// This contract handles swapping to and from xSushi, SushiSwap's staking token.
contract XTokenUpgradeable is OwnableUpgradeable, ERC20Upgradeable {
    IERC20Upgradeable public baseToken;
    mapping(address => uint256) internal timelock;

    event Timelocked(address user, uint256 until);

    function __XToken_init(address _baseToken, string memory name, string memory symbol) public initializer {
        __Ownable_init();
        // string memory _name = INFTXInventoryStaking(msg.sender).nftxVaultFactory().vault();
        __ERC20_init(name, symbol);
        baseToken = IERC20Upgradeable(_baseToken);
    }

    function mint(address who, uint256 amount) public onlyOwner {
        _mint(who, amount);
    }

    function timelockMint(address account, uint256 amount, uint256 timelockLength) public onlyOwner virtual {
        uint256 timelockFinish = block.timestamp + timelockLength;
        timelock[account] = timelockFinish;
        emit Timelocked(account, timelockFinish);
        _mint(account, amount);
    }

    function timelockAccount(address account , uint256 timelockLength) public onlyOwner virtual {
        uint256 timelockFinish = block.timestamp + timelockLength;
        timelock[account] = timelockFinish;
        emit Timelocked(account, timelockFinish);
    }

    function burn(address who, uint256 amount) public onlyOwner {
        require(block.timestamp > timelock[who], "User locked");
        _burn(who, amount);
    }

    function timelockUntil(address account) public view returns (uint256) {
        return timelock[account];
    }
    
    function _transfer(address from, address to, uint256 value) internal override {
        require(block.timestamp > timelock[from], "User locked");
        super._transfer(from, to, value);
    }
}