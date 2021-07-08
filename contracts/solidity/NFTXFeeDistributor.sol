// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./interface/INFTXVaultFactory.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/SafeMathUpgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";

contract NFTXFeeDistributor is INFTXFeeDistributor, ReentrancyGuardUpgradeable, PausableUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  bool public distributionPaused;

  address public override nftxVaultFactory;
  address public override lpStaking;
  address public override treasury;
  uint256 private constant threshold = 10**9;
  uint256 public override defaultTreasuryAlloc;
  uint256 public override defaultLPAlloc;

  // Total allocation points per vault. 
  mapping(uint256 => uint256) public override allocTotal;
  // Vault-specific treasury allocations.
  mapping(uint256 => uint256) public override specificTreasuryAlloc;
  mapping(uint256 => FeeReceiver[]) feeReceivers;

  event UpdateDefaultLPAlloc(uint256 newLPAlloc);
  event UpdateDefaultTreasuryAlloc(uint256 newTreasuryAlloc);
  event UpdateSpecificTreasuryAlloc(uint256 vaultId, uint256 newSpecificAlloc);

  event UpdateTreasuryAddress(address newTreasury);
  event UpdateLPStakingAddress(address newLPStaking);
  event UpdateNFTXVaultFactory(address factory);
  event PauseDistribution(bool paused); 

  event AddFeeReceiver(uint256 vaultId, address receiver, uint256 allocPoint);
  event UpdateFeeReceiverAlloc(uint256 vaultId, address receiver, uint256 allocPoint);
  event UpdateFeeReceiverAddress(uint256 vaultId, address oldReceiver, address newReceiver);
  event RemoveFeeReceiver(uint256 vaultId, address receiver);
  
  function __FeeDistributor__init__(address _lpStaking, address _treasury) public override initializer {
    __Pausable_init();
    setTreasuryAddress(_treasury);
    setDefaultTreasuryAlloc(0);
    setLPStakingAddress(_lpStaking);
    setDefaultLPAlloc(0.5 ether);
  }

  function distribute(uint256 vaultId) external override virtual nonReentrant {
    require(nftxVaultFactory != address(0));
    address _vault = INFTXVaultFactory(nftxVaultFactory).vault(vaultId);

    uint256 tokenBalance = IERC20Upgradeable(_vault).balanceOf(address(this));

    if (distributionPaused) {
      IERC20Upgradeable(_vault).safeTransfer(treasury, tokenBalance);
      return;
    } 

    if (tokenBalance <= threshold) {
      return;
    }
    // Leave some balance for dust since we know we have more than 10**9.
    tokenBalance -= 1000;
    
    uint256 _treasuryAlloc = specificTreasuryAlloc[vaultId];
    if (_treasuryAlloc == 0) {
      _treasuryAlloc = defaultTreasuryAlloc;
    }

    uint256 _allocTotal = allocTotal[vaultId] + _treasuryAlloc;
    uint256 amountToSend = tokenBalance * _treasuryAlloc / _allocTotal;
    amountToSend = amountToSend > tokenBalance ? tokenBalance : amountToSend;
    IERC20Upgradeable(_vault).safeTransfer(treasury, amountToSend);

    FeeReceiver[] memory _feeReceivers = feeReceivers[vaultId];
    for (uint256 i = 0; i < _feeReceivers.length; i++) {
      _sendForReceiver(_feeReceivers[i], vaultId, _vault, tokenBalance, _allocTotal);
    } 
  }

  function addReceiver(uint256 _vaultId, uint256 _allocPoint, address _receiver, bool _isContract) external override virtual onlyOwner  {
    _addReceiver(_vaultId, _allocPoint, _receiver, _isContract);
  }

  function initializeVaultReceivers(uint256 _vaultId) external override {
    require(msg.sender == nftxVaultFactory, "FeeReceiver: not factory");
    _addReceiver(_vaultId, defaultLPAlloc, lpStaking, true);
    INFTXLPStaking(lpStaking).addPoolForVault(_vaultId);
  }

  function changeMultipleReceiverAlloc(
    uint256[] memory _vaultIds, 
    uint256[] memory _receiverIdxs, 
    uint256[] memory allocPoints
  ) public override virtual onlyOwner {
    require(_vaultIds.length == _receiverIdxs.length, "Lengths not equal");
    require(allocPoints.length == _receiverIdxs.length, "Lengths not equal");
    for (uint256 i = 0; i < _vaultIds.length; i++) {
      changeReceiverAlloc(_vaultIds[i], _receiverIdxs[i], allocPoints[i]);
    }
  }

  function changeReceiverAlloc(uint256 _vaultId, uint256 _receiverIdx, uint256 _allocPoint) public override virtual onlyOwner {
    FeeReceiver storage feeReceiver = feeReceivers[_vaultId][_receiverIdx];
    allocTotal[_vaultId] -= feeReceiver.allocPoint;
    feeReceiver.allocPoint = _allocPoint;
    allocTotal[_vaultId] += _allocPoint;
    emit UpdateFeeReceiverAlloc(_vaultId, feeReceiver.receiver, _allocPoint);
  }

  function changeMultipleReceiverAddress(
    uint256[] memory _vaultIds, 
    uint256[] memory _receiverIdxs, 
    address[] memory addresses, 
    bool[] memory isContracts
  ) public override virtual onlyOwner {
    require(_vaultIds.length == _receiverIdxs.length, "Lengths not equal");
    require(addresses.length == _receiverIdxs.length, "Lengths not equal");
    require(addresses.length == isContracts.length, "Lengths not equal");
    for (uint256 i = 0; i < _vaultIds.length; i++) {
      changeReceiverAddress(_vaultIds[i], _receiverIdxs[i], addresses[i], isContracts[i]);
    }
  }

  function changeReceiverAddress(uint256 _vaultId, uint256 _receiverIdx, address _address, bool _isContract) public override virtual onlyOwner {
    FeeReceiver storage feeReceiver = feeReceivers[_vaultId][_receiverIdx];
    address oldReceiver = feeReceiver.receiver;
    feeReceiver.receiver = _address;
    feeReceiver.isContract = _isContract;
    emit UpdateFeeReceiverAddress(_vaultId, oldReceiver, _address);
  }

  function removeReceiver(uint256 _vaultId, uint256 _receiverIdx) external override virtual onlyOwner {
    FeeReceiver[] storage feeReceiversForVault = feeReceivers[_vaultId];
    uint256 arrLength = feeReceiversForVault.length;
    require(_receiverIdx < arrLength, "FeeDistributor: Out of bounds");
    emit RemoveFeeReceiver(_vaultId, feeReceiversForVault[_receiverIdx].receiver);
    allocTotal[_vaultId] -= feeReceiversForVault[_receiverIdx].allocPoint;
    // Copy the last element to what is being removed and remove the last element.
    feeReceiversForVault[_receiverIdx] = feeReceiversForVault[arrLength-1];
    feeReceiversForVault.pop();
  }

  function setTreasuryAddress(address _treasury) public override onlyOwner {
    require(_treasury != address(0), "Treasury != address(0)");
    treasury = _treasury;
    emit UpdateTreasuryAddress(_treasury);
  }

  function setDefaultTreasuryAlloc(uint256 _allocPoint) public override onlyOwner {
    defaultTreasuryAlloc = _allocPoint;
    emit UpdateDefaultTreasuryAlloc(_allocPoint);
  }

  function setSpecificTreasuryAlloc(uint256 vaultId, uint256 _allocPoint) external override onlyOwner {
    specificTreasuryAlloc[vaultId] = _allocPoint;
    emit UpdateSpecificTreasuryAlloc(vaultId, _allocPoint);
  }

  function setLPStakingAddress(address _lpStaking) public override onlyOwner {
    require(_lpStaking != address(0), "LPStaking != address(0)");
    lpStaking = _lpStaking;
    emit UpdateLPStakingAddress(_lpStaking);
  }

  function setDefaultLPAlloc(uint256 _allocPoint) public override onlyOwner {
    defaultLPAlloc = _allocPoint;
    emit UpdateDefaultLPAlloc(_allocPoint);
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

  function _addReceiver(uint256 _vaultId, uint256 _allocPoint, address _receiver, bool _isContract) internal virtual {
    allocTotal[_vaultId] += _allocPoint;
    FeeReceiver memory _feeReceiver = FeeReceiver(_allocPoint, _receiver, _isContract);
    feeReceivers[_vaultId].push(_feeReceiver);
    emit AddFeeReceiver(_vaultId, _receiver, _allocPoint);
  }

  function _sendForReceiver(FeeReceiver memory _receiver, uint256 _vaultId, address _vault, uint256 _tokenBalance, uint256 _allocTotal) internal virtual {
    uint256 amountToSend = _tokenBalance * _receiver.allocPoint / _allocTotal;
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