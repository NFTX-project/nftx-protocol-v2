// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./util/Ownable.sol";
import "./util/ReentrancyGuard.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXInventoryStaking.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./interface/INFTXVault.sol";

contract NFTXUnstakingInventoryZap is Ownable, ReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    INFTXVaultFactory public vaultFactory;
    INFTXInventoryStaking public inventoryStaking;

    event InventoryUnstaked(
        uint256 vaultId,
        uint256 xTokensUnstaked,
        uint256 numNftsRedeemed,
        address unstaker
    );

    function setVaultFactory(address addr) public onlyOwner {
        vaultFactory = INFTXVaultFactory(addr);
    }

    function setInventoryStaking(address addr) public onlyOwner {
        inventoryStaking = INFTXInventoryStaking(addr);
    }

    function unstakeInventory(
        uint256 vaultId,
        uint256 numNfts,
        uint256 remainingPortionToUnstake
    ) public {
        require(remainingPortionToUnstake <= 10e17);
        address vTokenAddr = vaultFactory.vault(vaultId);
        address xTokenAddr = inventoryStaking.xTokenAddr(vTokenAddr);
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        IERC20Upgradeable xToken = IERC20Upgradeable(xTokenAddr);

        uint256 initialVTokenBal = vToken.balanceOf(address(this));
        // calculate xTokenAmount to pull
        uint256 xTokenAmount;
        if (remainingPortionToUnstake == 10e17) {
            xTokenAmount = xToken.balanceOf(msg.sender);
        } else {
            uint256 reqXTokens = ((numNfts * 10e17) * 10e17) /
                inventoryStaking.xTokenShareValue(vaultId);
            require(xToken.balanceOf(msg.sender) > reqXTokens);
            uint256 remainingXTokens = xToken.balanceOf(msg.sender) -
                reqXTokens;
            xTokenAmount =
                reqXTokens +
                ((remainingXTokens * remainingPortionToUnstake) / 10e17);
        }

        // pull xTokens then unstake for vTokens
        xToken.safeTransferFrom(msg.sender, address(this), xTokenAmount);
        if (
            xToken.allowance(address(this), address(inventoryStaking)) <
            xTokenAmount
        ) {
            xToken.approve(address(inventoryStaking), type(uint256).max);
        }
        inventoryStaking.withdraw(vaultId, xTokenAmount);

        // reedem NFTs with vTokens, if requested
        if (numNfts > 0) {
            if (vToken.allowance(address(this), vTokenAddr) < numNfts * 10e17) {
                vToken.approve(vTokenAddr, type(uint256).max);
            }
            INFTXVault(vTokenAddr).redeemTo(
                numNfts,
                new uint256[](0),
                msg.sender
            );
        }

        uint256 vTokenRemainder = vToken.balanceOf(address(this)) -
            initialVTokenBal;

        // if vToken remainder more than dust then return to sender
        if (vTokenRemainder > 100) {
            vToken.safeTransfer(msg.sender, vTokenRemainder);
        }

        emit InventoryUnstaked(vaultId, xTokenAmount, numNfts, msg.sender);
    }

    receive() external payable {
        revert("Don't send ETH");
    }

    function rescue(address token) external onlyOwner {
        IERC20Upgradeable(token).safeTransfer(
            msg.sender,
            IERC20Upgradeable(token).balanceOf(address(this))
        );
    }
}
