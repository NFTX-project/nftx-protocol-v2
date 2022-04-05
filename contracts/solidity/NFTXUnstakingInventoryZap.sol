// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./util/Ownable.sol";
import "./util/ReentrancyGuard.sol";
import "./interface/INFTXVaultFactory.sol";
import "./NFTXInventoryStaking.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./interface/INFTXVault.sol";
import "./interface/IUniswapV2Router01.sol";
import "./token/IWETH.sol";
import "./interface/IUniswapV2Pair.sol";

contract NFTXUnstakingInventoryZap is Ownable, ReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    INFTXVaultFactory public vaultFactory;
    NFTXInventoryStaking public inventoryStaking;
    IUniswapV2Router01 public sushiRouter;
    IWETH public weth;

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
        inventoryStaking = NFTXInventoryStaking(addr);
    }

    function setSushiRouterAndWeth(address sushiRouterAddr) public onlyOwner {
        sushiRouter = IUniswapV2Router01(sushiRouterAddr);
        weth = IWETH(sushiRouter.WETH());
    }

    function unstakeInventory(
        uint256 vaultId,
        uint256 numNfts,
        uint256 remainingPortionToUnstake
    ) public payable {
        require(remainingPortionToUnstake <= 10e17);
        address vTokenAddr = vaultFactory.vault(vaultId);
        address xTokenAddr = inventoryStaking.xTokenAddr(vTokenAddr);
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        IERC20Upgradeable xToken = IERC20Upgradeable(xTokenAddr);

        // calculate xTokensToPull to pull
        uint256 xTokensToPull;
        if (remainingPortionToUnstake == 10e17) {
            xTokensToPull = xToken.balanceOf(msg.sender);
        } else {
            uint256 shareValue = inventoryStaking.xTokenShareValue(vaultId);
            uint256 reqXTokens = ((numNfts * 10e17) * 10e17) / shareValue;
            // check for rounding error
            if ((reqXTokens * shareValue) / 10e17 < numNfts * 10e17) {
                reqXTokens += 1;
            }

            if (xToken.balanceOf(msg.sender) < reqXTokens) {
                xTokensToPull = xToken.balanceOf(msg.sender);
            } else if (remainingPortionToUnstake == 0) {
                xTokensToPull = reqXTokens;
            } else {
                uint256 remainingXTokens = xToken.balanceOf(msg.sender) -
                    reqXTokens;
                xTokensToPull =
                    reqXTokens +
                    ((remainingXTokens * remainingPortionToUnstake) / 10e17);
            }
        }

        // pull xTokens then unstake for vTokens
        xToken.safeTransferFrom(msg.sender, address(this), xTokensToPull);
        if (
            xToken.allowance(address(this), address(inventoryStaking)) <
            xTokensToPull
        ) {
            xToken.approve(address(inventoryStaking), type(uint256).max);
        }

        uint256 initialVTokenBal = vToken.balanceOf(address(this));

        inventoryStaking.withdraw(vaultId, xTokensToPull);

        uint256 missingVToken;
        if (
            vToken.balanceOf(address(this)) - initialVTokenBal < numNfts * 10e17
        ) {
            missingVToken =
                (numNfts * 10e17) -
                (vToken.balanceOf(address(this)) - initialVTokenBal);
        }
        require(missingVToken < 100, "not enough vTokens");

        if (missingVToken > initialVTokenBal) {
            if (
                vToken.balanceOf(msg.sender) >= missingVToken &&
                vToken.allowance(address(this), vTokenAddr) >= missingVToken
            ) {
                vToken.safeTransferFrom(
                    msg.sender,
                    address(this),
                    missingVToken
                );
            } else {
                address[] memory path = new address[](2);
                path[0] = address(weth);
                path[1] = vTokenAddr;
                sushiRouter.swapETHForExactTokens{value: 1000000000}(
                    missingVToken,
                    path,
                    address(this),
                    block.timestamp + 10000
                );
            }
        }

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

        emit InventoryUnstaked(vaultId, xTokensToPull, numNfts, msg.sender);
    }

    function maxNftsUsingXToken(
        uint256 vaultId,
        address staker,
        address slpToken
    ) public view returns (uint256 numNfts, bool shortByTinyAmount) {
        if (inventoryStaking.timelockUntil(vaultId, staker) > block.timestamp) {
            return (0, false);
        }
        address vTokenAddr = vaultFactory.vault(vaultId);
        address xTokenAddr = inventoryStaking.xTokenAddr(vTokenAddr);
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        IERC20Upgradeable xToken = IERC20Upgradeable(xTokenAddr);
        IERC20Upgradeable lpPair = IERC20Upgradeable(slpToken);

        uint256 xTokenBal = xToken.balanceOf(staker);
        uint256 shareValue = inventoryStaking.xTokenShareValue(vaultId);
        uint256 vTokensA = (xTokenBal * shareValue) / 10e17;
        uint256 vTokensB = ((xTokenBal * shareValue) / 10e17) + 99;

        uint256 vTokensIntA = vTokensA / 10e17;
        uint256 vTokensIntB = vTokensB / 10e17;

        if (vTokensIntB > vTokensIntA) {
            if (
                vToken.balanceOf(msg.sender) >= 99 &&
                vToken.allowance(address(this), vTokenAddr) >= 99
            ) {
                return (vTokensIntB, true);
            } else if (lpPair.totalSupply() >= 10000) {
                return (vTokensIntB, true);
            } else if (vToken.balanceOf(address(this)) >= 99) {
                return (vTokensIntB, true);
            } else {
                return (vTokensIntA, false);
            }
        } else {
            return (vTokensIntA, false);
        }
    }

    receive() external payable {}

    function rescue(address token) external onlyOwner {
        if (token == address(0)) {
            (bool success, ) = payable(msg.sender).call{
                value: address(this).balance
            }("");
            require(
                success,
                "Address: unable to send value, recipient may have reverted"
            );
        } else {
            IERC20Upgradeable(token).safeTransfer(
                msg.sender,
                IERC20Upgradeable(token).balanceOf(address(this))
            );
        }
    }
}
