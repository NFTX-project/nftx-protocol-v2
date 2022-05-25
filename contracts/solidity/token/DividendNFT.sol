//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Upgradeable.sol";
import "./IERC20Upgradeable.sol";
import "../interface/IRewardDistributionToken.sol";
import "../util/OwnableUpgradeable.sol";
import "../util/SafeERC20Upgradeable.sol";
import "../util/SafeMathUpgradeable.sol";
import "../util/SafeMathInt.sol";

import "hardhat/console.sol";

/// @title Reward-Paying Token (renamed from Dividend)
/// @author Roger Wu (https://github.com/roger-wu)
/// @dev A mintable ERC20 token that allows anyone to pay and distribute a target token
///  to token holders as dividends and allows token holders to withdraw their dividends.
///  Reference: the source code of PoWH3D: https://etherscan.io/address/0xB3775fB83F7D12A36E0475aBdD1FCA35c091efBe#code
contract DividendNFTUpgradeable is OwnableUpgradeable, ERC721Upgradeable {
  using SafeMathUpgradeable for uint256;
  using SafeMathInt for int256;
  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  // With `magnitude`, we can properly distribute dividends even if the amount of received target is small.
  // For more discussion about choosing the value of `magnitude`,
  //  see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728
  uint256 constant internal magnitude = 2**128;

  mapping(uint256 => uint256) internal _tokenToVaultMapping;
  mapping(uint256 => uint256) internal _tokenBalance;
  mapping(uint256 => uint256) internal totalStaked;
  mapping(uint256 => uint256) internal magnifiedRewardPerShare1;
  mapping(uint256 => uint256) internal magnifiedRewardPerShare2;

  mapping(uint256 => int256) internal magnifiedRewardCorrections1;
  mapping(uint256 => int256) internal magnifiedRewardCorrections2;
  mapping(uint256 => uint256) internal withdrawnRewards1;
  mapping(uint256 => uint256) internal withdrawnRewards2;

  event RewardsDistributed(
    uint256 vaultID,
    uint256 amount1,
    uint256 amount2
  );

  // /// @dev This event MUST emit when an address withdraws their dividend.
  // /// @param to The address which withdraws target from this contract.
  // /// @param weiAmount The amount of withdrawn target in wei.
  // event RewardWithdrawn(
  //   address indexed to,
  //   uint256 weiAmount
  // );

  function __DividendNFT_init(string memory _name, string memory _symbol) public initializer {
    __Ownable_init();
    __ERC721_init(_name, _symbol);
  }

  /// @dev Internal function that mints tokens to an account.
  /// Update magnifiedRewardCorrections to keep dividends unchanged.
  function _mint(address to, uint256 tokenId, uint256 vaultID, uint256 valueBal) internal virtual {
    super._mint(to, tokenId);
    _tokenToVaultMapping[tokenId] = vaultID;
    _increaseBalance(tokenId, valueBal);
  }

  // does no transferring
  function _increaseBalance(uint256 tokenId, uint256 valueBal) internal virtual {
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    uint256 oldBal = _tokenBalance[tokenId];
    _tokenBalance[tokenId] = oldBal + valueBal;
    totalStaked[vaultId] += valueBal;
    console.log(vaultId);
    console.log(valueBal);
    console.log(totalStaked[vaultId]);
    magnifiedRewardCorrections1[vaultId] = magnifiedRewardCorrections1[vaultId]
      .sub( (magnifiedRewardPerShare1[vaultId].mul(valueBal)).toInt256() );
    magnifiedRewardCorrections2[vaultId] = magnifiedRewardCorrections2[vaultId]
      .sub( (magnifiedRewardPerShare2[vaultId].mul(valueBal)).toInt256() );
  }

  // does no transferring
  function _decreaseBalance(uint256 tokenId, uint256 valueSub) internal virtual {
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    uint256 oldBal = _tokenBalance[tokenId];
    _tokenBalance[tokenId] = oldBal - valueSub;
    totalStaked[vaultId] -= valueSub;
    magnifiedRewardCorrections1[vaultId] = magnifiedRewardCorrections1[vaultId]
      .add( (magnifiedRewardPerShare1[vaultId].mul(valueSub)).toInt256() );
    magnifiedRewardCorrections2[vaultId] = magnifiedRewardCorrections2[vaultId]
      .add( (magnifiedRewardPerShare2[vaultId].mul(valueSub)).toInt256() );
  }
    
  // /**
  //   * @dev Destroys `amount` tokens from `account`, deducting from the caller's
  //   * allowance.
  //   *
  //   * See {ERC20-_burn} and {ERC20-allowance}.
  //   *
  //   * Requirements:
  //   *
  //   * - the caller must have allowance for ``accounts``'s tokens of at least
  //   * `amount`.
  //   */
  // function burnFrom(address account, uint256 amount) public virtual onlyOwner {
  //     _burn(account, amount);
  // }

  /// @notice Distributes target to token holders as dividends.
  /// @dev It reverts if the total supply of tokens is 0.
  /// It emits the `RewardsDistributed` event if the amount of received target is greater than 0.
  /// About undistributed target tokens:
  ///   In each distribution, there is a small amount of target not distributed,
  ///     the magnified amount of which is
  ///     `(amount * magnitude) % totalSupply()`.
  ///   With a well-chosen `magnitude`, the amount of undistributed target
  ///     (de-magnified) in a distribution can be less than 1 wei.
  ///   We can actually keep track of the undistributed target in a distribution
  ///     and try to distribute it in the next distribution,
  ///     but keeping track of such data on-chain costs much more than
  ///     the saved target, so we don't do that.
  function _distributeRewards(uint256 vaultId, uint256 amount1, uint256 amount2) internal returns (bool) {
    require(amount1 > 0 || amount2 > 0, "RewardDist: 0 amount");
    uint256 total = totalStaked[vaultId];
    console.log(vaultId);
    console.log(total);
    require(total > 0, "No one is staked");

    // Because we receive the tokens from the staking contract, we assume the tokens have been received.
    if (amount1 > 0) {
      magnifiedRewardPerShare1[vaultId] = magnifiedRewardPerShare1[vaultId].add(
        (amount1).mul(magnitude) / total
      );
    }

    if (amount2 > 0) {
      magnifiedRewardPerShare2[vaultId] = magnifiedRewardPerShare2[vaultId].add(
        (amount2).mul(magnitude) / total
      );
    }

    emit RewardsDistributed(vaultId, amount1, amount2);
    return true;
  }

  function balanceOfNFT(uint256 tokenId) public view virtual returns (uint256) {
    return _tokenBalance[tokenId];
  }

  /// @notice Withdraws the target distributed to the sender.
  /// @dev It emits a `RewardWithdrawn` event if the amount of withdrawn target is greater than 0.
  function _deductWithdrawableRewards(uint256 tokenId) internal returns (uint256, uint256) {
    (uint256 _withdrawableReward1, uint256 _withdrawableReward2) = withdrawableRewardsOf(tokenId);
    if (_withdrawableReward1 == 0 && _withdrawableReward2 == 0) {
      return (0, 0);
    }
    
    address user = ownerOf(tokenId);

    if (_withdrawableReward1 > 0) {
      withdrawnRewards1[tokenId] = withdrawnRewards1[tokenId].add(_withdrawableReward1);
      // target.safeTransfer(user, _withdrawableReward1);
      // emit RewardWithdrawn(tokenId, user, _withdrawableReward);
    }

    if (_withdrawableReward2 > 0) {
      withdrawnRewards2[tokenId] = withdrawnRewards2[tokenId].add(_withdrawableReward2);
      // target.safeTransfer(user, _withdrawableReward2);
      // emit RewardWithdrawn(tokenId, user, _withdrawableReward1);
    }
    return (_withdrawableReward1, _withdrawableReward2);
  }

  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` can withdraw.
  function dividendsOf(uint256 tokenId) public view returns (uint256, uint256) {
    return withdrawableRewardsOf(tokenId);
  }

  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` can withdraw.
  function withdrawableRewardsOf(uint256 tokenId) internal view returns (uint256, uint256) {
    (uint256 accumulative1, uint256 accumulative2) = accumulativeRewardsOf(tokenId);
    return (accumulative1.sub(withdrawnRewards1[tokenId]), accumulative2.sub(withdrawnRewards2[tokenId]));
  }

  /// @notice View the amount of dividend in wei that an address has withdrawn.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` has withdrawn.
  function withdrawnRewardsOf(uint256 tokenId) public view returns (uint256, uint256) {
    return (withdrawnRewards1[tokenId], withdrawnRewards2[tokenId]);
  }


  /// @notice View the amount of dividend in wei that an address has earned in total.
  /// @dev accumulativeRewardOf(tokenId) = withdrawableRewardOf(tokenId) + withdrawnRewardOf(tokenId)
  /// = (magnifiedRewardPerShare * balanceOf(tokenId) + magnifiedRewardCorrections[tokenId]) / magnitude
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` has earned in total.
  function accumulativeRewardsOf(uint256 tokenId) public view returns (uint256, uint256) {
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    uint256 _bal = _tokenBalance[tokenId];

    uint256 accumulative1 = magnifiedRewardPerShare1[vaultId].mul(_bal).toInt256()
      .add(magnifiedRewardCorrections1[vaultId]).toUint256Safe() / magnitude;

    uint256 accumulative2 = magnifiedRewardPerShare2[vaultId].mul(_bal).toInt256()
      .add(magnifiedRewardCorrections2[vaultId]).toUint256Safe() / magnitude;

    return (accumulative1, accumulative2);
  }

  // /// @dev Internal function that burns an amount of the token of a given account.
  // /// Update magnifiedRewardCorrections to keep dividends unchanged.
  // /// @param account The account whose tokens will be burnt.
  // /// @param value The amount that will be burnt.
  // function _burn(address account, uint256 tokenId) internal override {
  //   super._burn(account, value);

  //   magnifiedRewardCorrections[account] = magnifiedRewardCorrections[account]
  //     .add( (magnifiedRewardPerShare.mul(value)).toInt256() );
  // }
  uint256[45] private __gap;
}