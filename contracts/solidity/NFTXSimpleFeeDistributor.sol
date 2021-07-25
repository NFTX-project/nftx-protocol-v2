// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXSimpleFeeDistributor.sol";
import "./interface/INFTXVaultFactory.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/SafeMathUpgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";

contract NFTXSimpleFeeDistributor is INFTXSimpleFeeDistributor, ReentrancyGuardUpgradeable, PausableUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  bool public distributionPaused;

  address public override nftxVaultFactory;
  address public override lpStaking;
  address public override treasury;
  uint256 private constant threshold = 10**9;

  // Total allocation points per vault. 
  uint256 public override allocTotal;
  FeeReceiver[] public feeReceivers;

  event UpdateTreasuryAddress(address newTreasury);
  event UpdateLPStakingAddress(address newLPStaking);
  event UpdateNFTXVaultFactory(address factory);
  event PauseDistribution(bool paused); 

  event AddFeeReceiver(address receiver, uint256 allocPoint);
  event UpdateFeeReceiverAlloc(address receiver, uint256 allocPoint);
  event UpdateFeeReceiverAddress(address oldReceiver, address newReceiver);
  event RemoveFeeReceiver(address receiver);
  
  function __SimpleFeeDistributor__init__(address _lpStaking, address _treasury) public override initializer {
    __Pausable_init();
    setTreasuryAddress(_treasury);
    setLPStakingAddress(_lpStaking);

    _addReceiver(0, _treasury, true);
    _addReceiver(0.5 ether, lpStaking, true);
  }

  function distribute(uint256 vaultId) external override virtual nonReentrant {
    require(nftxVaultFactory != address(0));
    address _vault = INFTXVaultFactory(nftxVaultFactory).vault(vaultId);

    uint256 tokenBalance = IERC20Upgradeable(_vault).balanceOf(address(this));

    if (distributionPaused || allocTotal == 0) {
      IERC20Upgradeable(_vault).safeTransfer(treasury, tokenBalance);
      return;
    } 

    if (tokenBalance <= threshold) {
      return;
    }
    // Leave some balance for dust since we know we have more than 10**9.
    tokenBalance -= 1000;

    uint256 length = feeReceivers.length;
    for (uint256 i = 0; i < length; i++) {
      FeeReceiver memory _feeReceiver = feeReceivers[i];
      uint256 amountToSend = tokenBalance * _feeReceiver.allocPoint / allocTotal;
      amountToSend = amountToSend > tokenBalance ? tokenBalance : amountToSend;
      _sendForReceiver(_feeReceiver, vaultId, _vault, amountToSend);
    }
  }

  function addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) external override virtual onlyOwner  {
    _addReceiver(_allocPoint, _receiver, _isContract);
  }

  function initializeVaultReceivers(uint256 _vaultId) external override {
    require(msg.sender == nftxVaultFactory, "FeeReceiver: not factory");
    INFTXLPStaking(lpStaking).addPoolForVault(_vaultId);
  }

  function changeReceiverAlloc(uint256 _receiverIdx, uint256 _allocPoint) public override virtual onlyOwner {
    FeeReceiver storage feeReceiver = feeReceivers[_receiverIdx];
    allocTotal -= feeReceiver.allocPoint;
    feeReceiver.allocPoint = _allocPoint;
    allocTotal += _allocPoint;
    emit UpdateFeeReceiverAlloc(feeReceiver.receiver, _allocPoint);
  }

  function changeReceiverAddress(uint256 _receiverIdx, address _address, bool _isContract) public override virtual onlyOwner {
    FeeReceiver storage feeReceiver = feeReceivers[_receiverIdx];
    address oldReceiver = feeReceiver.receiver;
    feeReceiver.receiver = _address;
    feeReceiver.isContract = _isContract;
    emit UpdateFeeReceiverAddress(oldReceiver, _address);
  }

  function removeReceiver(uint256 _receiverIdx) external override virtual onlyOwner {
    uint256 arrLength = feeReceivers.length;
    require(_receiverIdx < arrLength, "FeeDistributor: Out of bounds");
    emit RemoveFeeReceiver(feeReceivers[_receiverIdx].receiver);
    allocTotal -= feeReceivers[_receiverIdx].allocPoint;
    // Copy the last element to what is being removed and remove the last element.
    feeReceivers[_receiverIdx] = feeReceivers[arrLength-1];
    feeReceivers.pop();
  }

  function setTreasuryAddress(address _treasury) public override onlyOwner {
    require(_treasury != address(0), "Treasury != address(0)");
    treasury = _treasury;
    emit UpdateTreasuryAddress(_treasury);
  }

  function setLPStakingAddress(address _lpStaking) public override onlyOwner {
    require(_lpStaking != address(0), "LPStaking != address(0)");
    lpStaking = _lpStaking;
    emit UpdateLPStakingAddress(_lpStaking);
  }

  function setNFTXVaultFactory(address _factory) external override onlyOwner {
    nftxVaultFactory = _factory;
    emit UpdateNFTXVaultFactory(_factory);
  }

  function pauseFeeDistribution(bool pause) external onlyOwner {
    distributionPaused = pause;
    emit PauseDistribution(pause);
  }

  function rescueTokens(address _address) external override onlyOwner {
    uint256 balance = IERC20Upgradeable(_address).balanceOf(address(this));
    IERC20Upgradeable(_address).safeTransfer(msg.sender, balance);
  }

  function _addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) internal virtual {
    FeeReceiver memory _feeReceiver = FeeReceiver(_allocPoint, _receiver, _isContract);
    feeReceivers.push(_feeReceiver);
    allocTotal += _allocPoint;
    emit AddFeeReceiver(_receiver, _allocPoint);
  }

  function _sendForReceiver(FeeReceiver memory _receiver, uint256 _vaultId, address _vault, uint256 _tokenBalance) internal virtual {
    uint256 amountToSend = _tokenBalance * _receiver.allocPoint / allocTotal;
    // If we're at this point we know we have more than enough to perform this safely.
    uint256 balance = IERC20Upgradeable(_vault).balanceOf(address(this)) - 1000;
    amountToSend = amountToSend > balance ? balance : amountToSend;

    if (_receiver.isContract) {
      IERC20Upgradeable(_vault).approve(_receiver.receiver, amountToSend);
      // If the receive is not properly processed, send it to the treasury instead.
       
      bytes memory payload = abi.encodeWithSelector(INFTXLPStaking.receiveRewards.selector, _vaultId, amountToSend);
      (bool success, ) = address(_receiver.receiver).call(payload);

      // If the allowance has not been spent, it means we can pass it through the treasury instead.
      if (!success || IERC20Upgradeable(_vault).allowance(address(this), _receiver.receiver) > 0) {
        IERC20Upgradeable(_vault).safeTransfer(treasury, amountToSend);
        IERC20Upgradeable(_vault).approve(_receiver.receiver, 0);
      }
    } else {
      IERC20Upgradeable(_vault).safeTransfer(_receiver.receiver, amountToSend);
    }
  }
} 