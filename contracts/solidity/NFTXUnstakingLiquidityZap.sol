// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./util/Ownable.sol";
import "./util/ReentrancyGuard.sol";
import "./token/IWETH.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXInventoryStaking.sol";
import "./interface/INFTXLPStaking.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./interface/INFTXVault.sol";
import "./interface/IUniswapV2Router01.sol";
import "./interface/IUniswapV2Pair.sol";

contract NFTXUnstakingZap is Ownable, ReentrancyGuard {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    INFTXVaultFactory public vaultFactory;
    INFTXInventoryStaking public inventoryStaking;
    INFTXLPStaking public lpStaking;
    IUniswapV2Router01 public sushiRouter;
    IWETH public weth;

    event LiquidityUnstaked(
        uint256 vaultId,
        uint256 xSlpTokensUnstaked,
        uint256 numNftsRedeemed,
        address unstaker
    );

    function setVaultFactory(address addr) public onlyOwner {
        vaultFactory = INFTXVaultFactory(addr);
    }

    function setInventoryStaking(address addr) public onlyOwner {
        inventoryStaking = INFTXInventoryStaking(addr);
    }

    function setLpStaking(address addr) public onlyOwner {
        lpStaking = INFTXLPStaking(addr);
    }

    function setSushiRouterAndWeth(address sushiRouterAddr) public onlyOwner {
        sushiRouter = IUniswapV2Router01(sushiRouterAddr);
        weth = IWETH(sushiRouter.WETH());
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function _withdrawLiquidityFromSushi(
        address vTokenAddr,
        uint256 xSlpAmount,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal {
        uint256 vaultId = INFTXVault(vTokenAddr).vaultId();
        IERC20Upgradeable slpToken = IERC20Upgradeable(
            lpStaking.vaultStakingInfo(vaultId).stakingToken
        );
        if (
            slpToken.allowance(address(this), address(sushiRouter)) < xSlpAmount
        ) {
            slpToken.safeApprove(address(sushiRouter), type(uint256).max);
        }
        sushiRouter.removeLiquidity(
            vTokenAddr,
            address(weth),
            xSlpAmount,
            amountAMin,
            amountBMin,
            address(this),
            block.timestamp
        );
    }

    function _redeemNftsWithVTokens(address vTokenAddr, uint256 numNfts)
        internal
    {
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        if (vToken.allowance(address(this), vTokenAddr) < numNfts * 10e17) {
            vToken.approve(vTokenAddr, type(uint256).max);
        }
        INFTXVault(vTokenAddr).redeemTo(numNfts, new uint256[](0), msg.sender);
    }

    function _sellVTokensForEth(
        address vTokenAddr,
        uint256 vTokenAmount,
        uint256 amountOutMin
    ) internal {
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        if (
            vToken.allowance(address(this), address(sushiRouter)) < vTokenAmount
        ) {
            vToken.safeApprove(address(sushiRouter), type(uint256).max);
        }
        address[] memory path = new address[](2);
        path[0] = vTokenAddr;
        path[1] = address(weth);

        sushiRouter.swapExactTokensForTokens(
            vTokenAmount,
            amountOutMin,
            path,
            address(this),
            block.number
        );
    }

    function _stakeVTokens(address vTokenAddr, uint256 vTokenAmount) internal {
        IERC20Upgradeable vToken = IERC20Upgradeable(vTokenAddr);
        IERC20Upgradeable xToken = IERC20Upgradeable(
            inventoryStaking.xTokenAddr(address(vToken))
        );
        uint256 initialXTokenBal = xToken.balanceOf(address(this));

        if (
            vToken.allowance(address(this), address(inventoryStaking)) <
            vTokenAmount
        ) {
            vToken.safeApprove(address(inventoryStaking), type(uint256).max);
        }
        uint256 vaultId = INFTXVault(vTokenAddr).vaultId();
        inventoryStaking.deposit(vaultId, vTokenAmount);

        xToken.safeTransfer(
            msg.sender,
            xToken.balanceOf(address(this)) - initialXTokenBal
        );
    }

    function _returnVTokensIfMoreThanDust(
        address vTokenAddr,
        uint256 vTokenAmount
    ) internal {
        if (vTokenAmount > 100) {
            IERC20Upgradeable(vTokenAddr).safeTransfer(
                msg.sender,
                vTokenAmount
            );
        }
    }

    function _unwrapWethAndReturnEth(uint256 amount) internal {
        weth.withdraw(amount);
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "unable to send eth");
    }

    function unstakeLiquidity(
        address vTokenAddr,
        uint256 xSlpAmount,
        uint256 amountAMin,
        uint256 amountBMin,
        uint256 numNfts,
        uint256 minNumNfts,
        uint256 vTokenPortionToSell,
        uint256 amountOutMin,
        uint256 vTokenPortionToStake
    ) public {
        require(vTokenPortionToSell + vTokenPortionToStake <= 10e17);
        IERC20Upgradeable(
            lpStaking.newRewardDistributionToken(
                INFTXVault(vTokenAddr).vaultId()
            )
        ).safeTransferFrom(msg.sender, address(this), xSlpAmount);

        // save balances before claiming rewards and withdrawing liquidity
        uint256 initialWethBal = weth.balanceOf(address(this));
        uint256 initialVTokenBal = IERC20Upgradeable(vTokenAddr).balanceOf(
            address(this)
        );
        // claim vtoken rewards
        lpStaking.claimRewardsAsZap(INFTXVault(vTokenAddr).vaultId(), msg.sender);
        // unstake slpTokens using same amount of xSlpTokens
        lpStaking.withdraw(INFTXVault(vTokenAddr).vaultId(), xSlpAmount);

        // withdraw liquidity using slpTokens and receive vTokens + WETH
        _withdrawLiquidityFromSushi(
            vTokenAddr,
            xSlpAmount,
            amountAMin,
            amountBMin
        );

        // calculate the lesser of whole vTokens received and numNFTs
        uint256 numNftsToRedeem = _min(
            ((IERC20Upgradeable(vTokenAddr).balanceOf(address(this)) -
                initialVTokenBal) / 10e17),
            numNfts
        );
        require(numNftsToRedeem >= minNumNfts, "minNumNfts not met");

        // reedem NFTs with vTokens, if requested
        if (numNftsToRedeem > 0) {
            _redeemNftsWithVTokens(vTokenAddr, numNftsToRedeem);
        }

        uint256 vTokensAfterRedeeming = IERC20Upgradeable(vTokenAddr).balanceOf(
            address(this)
        ) - initialVTokenBal;

        // sell vTokens, if requested
        if (vTokenPortionToSell > 0) {
            _sellVTokensForEth(
                vTokenAddr,
                ((vTokensAfterRedeeming * vTokenPortionToSell) / 10e17),
                amountOutMin
            );
        }

        // stake vTokens, if requested
        if (vTokenPortionToStake > 0) {
            _stakeVTokens(
                vTokenAddr,
                ((vTokensAfterRedeeming * vTokenPortionToStake) / 10e17)
            );
        }

        // if vToken remainder is more than dust then return to sender
        _returnVTokensIfMoreThanDust(
            vTokenAddr,
            IERC20Upgradeable(vTokenAddr).balanceOf(address(this)) -
                initialVTokenBal
        );

        // unwrap WETH into ETH and return to sender
        _unwrapWethAndReturnEth(weth.balanceOf(address(this)) - initialWethBal);

        emit LiquidityUnstaked(
            INFTXVault(vTokenAddr).vaultId(),
            xSlpAmount,
            numNftsToRedeem,
            msg.sender
        );
    }

    receive() external payable {
        require(msg.sender == address(weth), "Don't send ETH");
    }

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
