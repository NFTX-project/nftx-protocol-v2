// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXSimpleFeeDistributor.sol";
import "./interface/INFTXInventoryStaking.sol";
import "./interface/INFTXVaultFactory.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/SafeMathUpgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";


/**
 * @title NFTX Simple Fee Distributor
 * @author The NFTX Team
 */

contract NFTXSimpleFeeDistributor is INFTXSimpleFeeDistributor, ReentrancyGuardUpgradeable, PausableUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;

  bool public distributionPaused;

  address public override nftxVaultFactory;
  address public override lpStaking;
  address public override treasury;

  // Total allocation points per vault. 
  uint256 public override allocTotal;
  FeeReceiver[] public feeReceivers;

  address public override inventoryStaking;


  /// @notice Emitted when the treasury address is updated.
  /// @param newTreasury The new address for the treasury contract
  event UpdateTreasuryAddress(address newTreasury);

  /// @notice Emitted when the LP Staking address is updated.
  /// @param newLPStaking The new address for the LP Staking contract
  event UpdateLPStakingAddress(address newLPStaking);

  /// @notice Emitted when the Inventory Staking address is updated.
  /// @param newInventoryStaking The new address for the Inventory Staking contract
  event UpdateInventoryStakingAddress(address newInventoryStaking);

  /// @notice Emitted when the NFTX Vault Factory address is updated.
  /// @param factory The new address for the NFTX Vault Factory contract
  event UpdateNFTXVaultFactory(address factory);

  /// @notice Emitted when this contract is paused or unpaused.
  /// @param paused Boolean value of if distribution has been paused (`true`) or unpaused (`false`)
  event PauseDistribution(bool paused); 

  /// @notice Emitted when a contract or non-contract receiver is added as a `FeeReceiver`.
  /// @param receiver The address of the new fee recipient
  /// @param allocPoint The number of allocation points assigned to the receiver
  event AddFeeReceiver(address receiver, uint256 allocPoint);

  /// @notice Emitted when a receiver's allocation is updated.
  /// @param receiver The address of the updated fee recipient
  /// @param allocPoint The new number of allocation points assigned to the receiver
  event UpdateFeeReceiverAlloc(address receiver, uint256 allocPoint);

  /// @notice Emitted when a receiver's address is updated.
  /// @param oldReceiver The old address of the receiver
  /// @param newReceiver The new address of the receiver
  event UpdateFeeReceiverAddress(address oldReceiver, address newReceiver);

  /// @notice Emitted when a receiver's address is removed.
  /// @param receiver The address of the receiver that was removed
  event RemoveFeeReceiver(address receiver);


  /**
   * @notice Initialiser for the fee distributor, setting relevant staking
   * and treasury addresses.
   * 
   * @dev Allows for upgradable deployment
   *
   * @param _lpStaking Address of our LP Staking contract
   * @param _treasury Address of our Treasury contract
   */

  function __SimpleFeeDistributor__init__(address _lpStaking, address _treasury) public override initializer {
    __Pausable_init();
    setTreasuryAddress(_treasury);
    setLPStakingAddress(_lpStaking);

    _addReceiver(0.8 ether, lpStaking, true);
  }


  /**
   * @notice Distributes fees to receivers.
   * @dev This needs expanding on.
   *
   * @param vaultId The vault ID that is to have its fees distributed
   */

  function distribute(uint256 vaultId) external override virtual nonReentrant {
    require(nftxVaultFactory != address(0));
    address _vault = INFTXVaultFactory(nftxVaultFactory).vault(vaultId);

    uint256 tokenBalance = IERC20Upgradeable(_vault).balanceOf(address(this));

    if (distributionPaused || allocTotal == 0) {
      IERC20Upgradeable(_vault).safeTransfer(treasury, tokenBalance);
      return;
    } 

    uint256 length = feeReceivers.length;
    uint256 leftover;
    for (uint256 i; i < length; ++i) {
      FeeReceiver memory _feeReceiver = feeReceivers[i];
      uint256 amountToSend = leftover + ((tokenBalance * _feeReceiver.allocPoint) / allocTotal);
      uint256 currentTokenBalance = IERC20Upgradeable(_vault).balanceOf(address(this));
      amountToSend = amountToSend > currentTokenBalance ? currentTokenBalance : amountToSend;
      bool complete = _sendForReceiver(_feeReceiver, vaultId, _vault, amountToSend);
      if (!complete) {
        uint256 remaining = IERC20Upgradeable(_vault).allowance(address(this), _feeReceiver.receiver);
        IERC20Upgradeable(_vault).safeApprove(_feeReceiver.receiver, 0);
        leftover = remaining;
      } else {
        leftover = 0;
      }
    }

    if (leftover != 0) {
      uint256 currentTokenBalance = IERC20Upgradeable(_vault).balanceOf(address(this));
      IERC20Upgradeable(_vault).safeTransfer(treasury, currentTokenBalance);
    }
  }


  /**
   * @notice Adds a receiver to the fee distributor. If a contract receiver is added, then they must
   * a call to `receiveRewards` as outlined in the `_sendForReceiver` function.
   *
   * @param _allocPoint The point allocation applied to the receiver
   * @param _receiver The address of the receiver
   * @param _isContract Flag to determine if the receiver is a contract, rather than a wallet address
   */

  function addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) external override virtual onlyOwner  {
    _addReceiver(_allocPoint, _receiver, _isContract);
  }


  /**
   * @notice Allows the NFTX Vault Factory contract caller to add a pool vault for LP Staking and,
   * if an inventory staking address is set, then deploys an xToken for the vault.
   *
   * @param _vaultId The NFTX vault ID
   */

  function initializeVaultReceivers(uint256 _vaultId) external override {
    require(msg.sender == nftxVaultFactory, "FeeReceiver: not factory");
    INFTXLPStaking(lpStaking).addPoolForVault(_vaultId);
    if (inventoryStaking != address(0))
      INFTXInventoryStaking(inventoryStaking).deployXTokenForVault(_vaultId);
  }


  /**
   * @notice Allows receiver allocation to be updated.
   * @dev Safe math is not implemented, so calculations must not exceed uint256 boundaries for `allocTotal`.
   *
   * @param _receiverIdx The index value of the feeReceiver in our internally stored array
   * @param _allocPoint The new allocation for the receiver
   */

  function changeReceiverAlloc(uint256 _receiverIdx, uint256 _allocPoint) public override virtual onlyOwner {
    require(_receiverIdx < feeReceivers.length, "FeeDistributor: Out of bounds");
    FeeReceiver storage feeReceiver = feeReceivers[_receiverIdx];
    allocTotal -= feeReceiver.allocPoint;
    feeReceiver.allocPoint = _allocPoint;
    allocTotal += _allocPoint;
    emit UpdateFeeReceiverAlloc(feeReceiver.receiver, _allocPoint);
  }


  /**
   * @notice Allows receiver address and `isContract` state to be updated.
   *
   * @param _receiverIdx The index value of the feeReceiver in our internally stored array
   * @param _address The new address for the receiver
   * @param _isContract The new `isContract` boolean flag for the receiver
   */

  function changeReceiverAddress(uint256 _receiverIdx, address _address, bool _isContract) public override virtual onlyOwner {
    FeeReceiver storage feeReceiver = feeReceivers[_receiverIdx];
    address oldReceiver = feeReceiver.receiver;
    feeReceiver.receiver = _address;
    feeReceiver.isContract = _isContract;
    emit UpdateFeeReceiverAddress(oldReceiver, _address);
  }


  /**
   * @notice Removes the receiver from our internal array so that they will no longer be
   * included in our fee distribution.
   * 
   * @dev This removal changes the index order of the `feeReceivers` array by moving the
   * last element to that of the removed value. External sources will need to reflect this
   * change for future updates before making subsequent calls.
   *
   * @param _receiverIdx The index value of the feeReceiver in our internally stored array
   */

  function removeReceiver(uint256 _receiverIdx) external override virtual onlyOwner {
    uint256 arrLength = feeReceivers.length;
    require(_receiverIdx < arrLength, "FeeDistributor: Out of bounds");
    emit RemoveFeeReceiver(feeReceivers[_receiverIdx].receiver);
    allocTotal -= feeReceivers[_receiverIdx].allocPoint;
    // Copy the last element to what is being removed and remove the last element.
    feeReceivers[_receiverIdx] = feeReceivers[arrLength-1];
    feeReceivers.pop();
  }


  /**
   * @notice Allows our treasury address to be updated.
   *
   * @param _treasury Address of our new Treasury contract
   */

  function setTreasuryAddress(address _treasury) public override onlyOwner {
    require(_treasury != address(0), "Treasury != address(0)");
    treasury = _treasury;
    emit UpdateTreasuryAddress(_treasury);
  }


  /**
   * @notice Allows our LP Staking address to be updated.
   *
   * @param _lpStaking Address of our new LP Staking contract
   */

  function setLPStakingAddress(address _lpStaking) public override onlyOwner {
    require(_lpStaking != address(0), "LPStaking != address(0)");
    lpStaking = _lpStaking;
    emit UpdateLPStakingAddress(_lpStaking);
  }


  /**
   * @notice Allows our Inventory Staking address to be updated.
   *
   * @param _inventoryStaking Address of our new Inventory Staking contract
   */

  function setInventoryStakingAddress(address _inventoryStaking) public override onlyOwner {
    inventoryStaking = _inventoryStaking;
    emit UpdateInventoryStakingAddress(_inventoryStaking);
  }


  /**
   * @notice Allows our NFTX Vault Factory address to be updated.
   *
   * @param _factory Address of our new NFTX Vault Factory contract
   */

  function setNFTXVaultFactory(address _factory) external override onlyOwner {
    require(address(nftxVaultFactory) == address(0), "nftxVaultFactory is immutable");
    nftxVaultFactory = _factory;
    emit UpdateNFTXVaultFactory(_factory);
  }


  /**
   * @notice Allows our fee distribution system to be paused or unpaused.
   *
   * @param _pause A boolean representation of if the distribution should be paused
   */

  function pauseFeeDistribution(bool _pause) external onlyOwner {
    distributionPaused = _pause;
    emit PauseDistribution(_pause);
  }


  /**
   * @notice Allows tokens to be rescued from the contract to the sender. This will transfer
   * the entire balance of the matching ERC20 token.
   *
   * @param _address The address of the token to be rescued
   */

  function rescueTokens(address _address) external override onlyOwner {
    uint256 balance = IERC20Upgradeable(_address).balanceOf(address(this));
    IERC20Upgradeable(_address).safeTransfer(msg.sender, balance);
  }


  /**
   * @notice Adds a `FeeReceiver` to our internally stored fee receivers array.
   * 
   * @dev The new receiver will always be added to the end of the array.
   *
   * @param _allocPoint The new allocation for the receiver
   * @param _receiver The address of the receiver
   * @param _isContract Flag to determine if the receiver is a contract, rather than a wallet address
   */

  function _addReceiver(uint256 _allocPoint, address _receiver, bool _isContract) internal virtual {
    FeeReceiver memory _feeReceiver = FeeReceiver(_allocPoint, _receiver, _isContract);
    feeReceivers.push(_feeReceiver);
    allocTotal += _allocPoint;
    emit AddFeeReceiver(_receiver, _allocPoint);
  }


  /**
   * @notice Sends the specified amount of tokens to a receiver from an NFTX vault.
   *
   * @dev If the receiver is a contract then they must implement `receiveRewards` to handle
   * the fee distribution.
   * 
   * @param _receiver Address of the receiver contract or wallet
   * @param _vaultId The ID of the NFTX vault, provided to the external contract
   * @param _vault The address of the NFTX vault
   * @param amountToSend The amount of tokens distributed to the receiver
   * 
   * @returns bool If the tokens were successfully transferred
   */

  function _sendForReceiver(FeeReceiver memory _receiver, uint256 _vaultId, address _vault, uint256 amountToSend) internal virtual returns (bool) {
    if (_receiver.isContract) {
      IERC20Upgradeable(_vault).safeIncreaseAllowance(_receiver.receiver, amountToSend);
       
      bytes memory payload = abi.encodeWithSelector(INFTXLPStaking.receiveRewards.selector, _vaultId, amountToSend);
      (bool success, ) = address(_receiver.receiver).call(payload);

      // If the allowance has not been spent, it means we can pass it forward to next.
      return success && IERC20Upgradeable(_vault).allowance(address(this), _receiver.receiver) == 0;
    } else {
      IERC20Upgradeable(_vault).safeTransfer(_receiver.receiver, amountToSend);
      return true;
    }
  }
} 