//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Upgradeable.sol";
import "./IERC20Upgradeable.sol";
import "../interface/IRewardDistributionToken.sol";
import "../util/OwnableUpgradeable.sol";
import "../util/SafeERC20Upgradeable.sol";
import "../util/SafeMathUpgradeable.sol";
import "../util/SafeMathInt.sol";

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

  mapping(uint256 => uint256) private _timelockedUntil;

  mapping(uint256 => uint256) private _tokenToVaultMapping;
  mapping(uint256 => uint256) private _tokenBalance;
  mapping(uint256 => uint256) private _totalStaked;
  mapping(uint256 => uint256) private _magnifiedRewardPerShare;

  mapping(uint256 => int256) private _magnifiedRewardCorrections;
  mapping(uint256 => uint256) private _withdrawnRewards;

  event RewardsDistributed(
    uint256 vaultID,
    uint256 amount1
  );

  event Timelocked(uint256 tokenId, uint256 timelockDuration);
  event IncreasePosition(uint256 tokenId, uint256 amount);
  event DecreasePosition(uint256 tokenId, uint256 amount);

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

  function maxTimelockLength() public virtual returns (uint256) {
    return 2 weeks;
  }
  
  function _timelockNFT(uint256 tokenId, uint256 timelockDuration) internal virtual {
    require(timelockDuration < maxTimelockLength(), "Timelock too long");
    _timelockedUntil[tokenId] = block.timestamp + timelockDuration;
    emit Timelocked(tokenId, timelockDuration);
  }

  function vaultForToken(uint256 tokenId) public view returns (uint256) {
    return _tokenToVaultMapping[tokenId];
  } 

  /// @dev Internal function that mints tokens to an account.
  /// Update magnifiedRewardCorrections to keep dividends unchanged.
  function _mint(address to, uint256 tokenId, uint256 vaultID, uint256 valueBal) internal virtual {
    super._mint(to, tokenId);
    _tokenToVaultMapping[tokenId] = vaultID;
    _increaseBalance(tokenId, valueBal);
  }

  // ADD BURN 

  // does no transferring
  function _increaseBalance(uint256 tokenId, uint256 valueBal) internal virtual {
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    uint256 oldBal = _tokenBalance[tokenId];
    _tokenBalance[tokenId] = oldBal + valueBal;
    _totalStaked[vaultId] += valueBal;
    
    _magnifiedRewardCorrections[vaultId] = _magnifiedRewardCorrections[vaultId]
      .sub( (_magnifiedRewardPerShare[vaultId].mul(valueBal)).toInt256() );

    emit IncreasePosition(tokenId, valueBal);
  }

  // does no transferring
  function _decreaseBalance(uint256 tokenId, uint256 valueSub) internal virtual {
    require(block.timestamp > _timelockedUntil[tokenId], "in timelock");
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    _tokenBalance[tokenId] -= valueSub;
    _totalStaked[vaultId] -= valueSub;
    
    _magnifiedRewardCorrections[vaultId] = _magnifiedRewardCorrections[vaultId]
      .add( (_magnifiedRewardPerShare[vaultId].mul(valueSub)).toInt256() );

    emit DecreasePosition(tokenId, valueSub);
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
  function _distributeRewards(uint256 vaultId, uint256 amount) internal returns (bool) {
    require(amount > 0, "RewardDist: 0 amount");
    uint256 total = _totalStaked[vaultId];
    require(total > 0, "No one is staked");

    // Because we receive the tokens from the staking contract, we assume the tokens have been received.
    if (amount > 0) {
      _magnifiedRewardPerShare[vaultId] = _magnifiedRewardPerShare[vaultId].add(
        (amount).mul(magnitude) / total
      );
    }

    emit RewardsDistributed(vaultId, amount);
    return true;
  }

  function balanceOfNFT(uint256 tokenId) public view virtual returns (uint256) {
    return _tokenBalance[tokenId];
  }

  function vaultIdForToken(uint256 tokenId) public view virtual returns (uint256) {
    return _tokenToVaultMapping[tokenId];
  }

  /// @notice Withdraws the target distributed to the sender.
  /// @dev It emits a `RewardWithdrawn` event if the amount of withdrawn target is greater than 0.
  function _deductWithdrawableRewards(uint256 tokenId) internal returns (uint256) {
    uint256 _withdrawableRewards = withdrawableRewardsOf(tokenId);
    if (_withdrawableRewards == 0) {
      return 0;
    }

    _withdrawnRewards[tokenId] = _withdrawnRewards[tokenId].add(_withdrawableRewards);
    // address user = ownerOf(tokenId);
      // target.safeTransfer(user, _withdrawableReward1);
      // emit RewardWithdrawn(tokenId, user, _withdrawableReward);
    // }
    return _withdrawableRewards;
  }

  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` can withdraw.
  function dividendsOf(uint256 tokenId) public view returns (uint256) {
    return withdrawableRewardsOf(tokenId);
  }

  /// @notice View the amount of dividend in wei that an address can withdraw.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` can withdraw.
  function withdrawableRewardsOf(uint256 tokenId) internal view returns (uint256) {
    uint256 accumulative = accumulativeRewardsOf(tokenId);
    return accumulative.sub(_withdrawnRewards[tokenId]);
  }

  /// @notice View the amount of dividend in wei that an address has withdrawn.
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` has withdrawn.
  function withdrawnRewardsOf(uint256 tokenId) public view returns (uint256) {
    return _withdrawnRewards[tokenId];
  }


  /// @notice View the amount of dividend in wei that an address has earned in total.
  /// @dev accumulativeRewardOf(tokenId) = withdrawableRewardOf(tokenId) + withdrawnRewardOf(tokenId)
  /// = (magnifiedRewardPerShare * balanceOf(tokenId) + magnifiedRewardCorrections[tokenId]) / magnitude
  /// @param tokenId The address of a token holder.
  /// @return The amount of dividend in wei that `tokenId` has earned in total.
  function accumulativeRewardsOf(uint256 tokenId) public view returns (uint256) {
    uint256 vaultId = _tokenToVaultMapping[tokenId];
    uint256 _bal = _tokenBalance[tokenId];

    uint256 accumulative = _magnifiedRewardPerShare[vaultId].mul(_bal).toInt256()
      .add(_magnifiedRewardCorrections[vaultId]).toUint256Safe() / magnitude;

    return accumulative;
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