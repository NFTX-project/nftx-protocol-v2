// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXVault.sol";
import "./interface/INFTXInventoryStaking.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/IERC20Metadata.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/Address.sol";
import "./util/Create2.sol";
import "./proxy/UpgradeableBeacon.sol";
import "./proxy/Create2BeaconProxy.sol";
import "./token/XTokenUpgradeable.sol";
import "./univ3/INonfungiblePositionManager.sol";
import "./univ3/PoolAddress.sol";

// Author: 0xKiwi.

// Pausing codes for inventory staking are:
// 10: Deposit

contract NFTXInventoryStaking is PausableUpgradeable, UpgradeableBeacon {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Small locktime to prevent flash deposits.
    uint256 internal constant DEFAULT_LOCKTIME = 2;
    address public defaultPair;
    bytes internal constant beaconCode = type(Create2BeaconProxy).creationCode;
        /// @dev The minimum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**-128
    int24 internal constant MIN_TICK = -887272;
    /// @dev The maximum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**128
    int24 internal constant MAX_TICK = -MIN_TICK;
    uint24 internal constant DEFAULT_FEE = 200;

    address public v3Factory;
    INonfungiblePositionManager public nftManager;
    INFTXVaultFactory public nftxVaultFactory;

    mapping(uint256 => uint256) vaultV3PositionId;

    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);
    event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender);
    event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender);
    event FeesReceived(uint256 vaultId, uint256 amount);

    function __NFTXInventoryStaking_init(address _v3Factory, address _nftManager, address _defaultPair, address _nftxVaultFactory) external virtual initializer {
        __Ownable_init();
        nftxVaultFactory = INFTXVaultFactory(_nftxVaultFactory);
        v3Factory = _v3Factory;
        nftManager = INonfungiblePositionManager(_nftManager);
        defaultPair = _defaultPair;
        address xTokenImpl = address(new XTokenUpgradeable());
        __UpgradeableBeacon__init(xTokenImpl);
    }

    modifier onlyAdmin() {
        require(msg.sender == owner() || msg.sender == nftxVaultFactory.feeDistributor(), "LPStaking: Not authorized");
        _;
    }

    function initializeUniV3Position(uint256 vaultId, uint160 sqrtPrice) public returns (uint256) {
      require(vaultV3PositionId[vaultId] == 0, "Vault V3 position exists");
      address vaultToken = nftxVaultFactory.vault(vaultId);
      PoolAddress.PoolKey memory poolKey = PoolAddress.getPoolKey(vaultToken, defaultPair, DEFAULT_FEE);
      address pool = nftManager.createAndInitializePoolIfNecessary(poolKey.token0, poolKey.token1, poolKey.fee, sqrtPrice);
      INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
        token0: poolKey.token0,
        token1: poolKey.token1,
        fee: poolKey.fee,
        tickLower: MIN_TICK,
        tickUpper: MAX_TICK,
        amount0Desired: 0,
        amount1Desired: 0,
        amount0Min: 0,
        amount1Min: 0,
        recipient: address(this),
        deadline: block.timestamp
      });
      (uint256 tokenId, , ,) = nftManager.mint(params);
      vaultV3PositionId[vaultId] = tokenId;

      return tokenId;
    }

    function addLiquidityToVaultV3Position(uint256 vaultId, uint256 amount0, uint256 amount1) public {
      uint256 tokenId = vaultV3PositionId[vaultId];
      require(tokenId != 0, "No Vault V3 position");

      // pull tokens 
      // approve position manager

      (,,,,,,, uint128 oldLiquidity,,,,) = nftManager.positions(tokenId);

      INonfungiblePositionManager.IncreaseLiquidityParams memory params = INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: tokenId,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: amount0,
        amount1Min: amount1,
        deadline: block.timestamp
      });
      (uint128 newLiquidity, uint256 amount0, uint256 amount1) = nftManager.increaseLiquidity(params);

      // _mintTokensForLiquidityAdded(vaultId, oldLiquidity, newLiquidity);
    }

    function deployXTokenForVault(uint256 vaultId) public virtual {
      address vaultToken = nftxVaultFactory.vault(vaultId);
      address deployedXToken = xTokenAddr(address(vaultToken));

      if (isContract(deployedXToken)) {
          return;
      }

      address xToken = _deployXToken(vaultToken);
      emit XTokenCreated(vaultId, vaultToken, xToken);
    }

    function receiveRewards(uint256 vaultId, uint256 amount) external virtual onlyAdmin returns (bool) {
      address vaultToken = nftxVaultFactory.vault(vaultId);
      address deployedXToken = xTokenAddr(address(vaultToken));
      
      // Don't distribute rewards unless there are people to distribute to.
      // Also added here if the distribution token is not deployed, just forfeit rewards for now.
      if (!isContract(deployedXToken) || XTokenUpgradeable(deployedXToken).totalSupply() == 0) {
          return false;
      }
      // We "pull" to the dividend tokens so the fee distributor only needs to approve this contract.
      IERC20Upgradeable(vaultToken).safeTransferFrom(msg.sender, deployedXToken, amount);
      emit FeesReceived(vaultId, amount);
      return true;
    }

   function xTokenShareValue(uint256 vaultId) external view virtual returns (uint256) {
      uint256 tokenId = vaultV3PositionId[vaultId];
      require(tokenId != 0, "No Vault V3 position");

      (,,,,,,, uint128 liquidity,,,,) = nftManager.positions(tokenId);

      address vaultToken = nftxVaultFactory.vault(vaultId);
      XTokenUpgradeable xToken = XTokenUpgradeable(xTokenAddr(address(vaultToken)));
      require(address(xToken) != address(0), "XToken not deployed");

      uint256 multiplier = 10 ** 18;
      return xToken.totalSupply() > 0 
          ? multiplier * liquidity / xToken.totalSupply() 
          : multiplier;
    }

    function timelockUntil(uint256 vaultId, address who) external view returns (uint256) {
        XTokenUpgradeable xToken = XTokenUpgradeable(vaultXToken(vaultId));
        return xToken.timelockUntil(who);
    }

    function balanceOf(uint256 vaultId, address who) external view returns (uint256) {
        XTokenUpgradeable xToken = XTokenUpgradeable(vaultXToken(vaultId));
        return xToken.balanceOf(who);
    }

    // Note: this function does not guarantee the token is deployed, we leave that check to elsewhere to save gas.
    function xTokenAddr(address baseToken) public view virtual returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(baseToken, defaultPair));
        address tokenAddr = Create2.computeAddress(salt, keccak256(type(Create2BeaconProxy).creationCode));
        return tokenAddr;
    }
    
    function vaultXToken(uint256 vaultId) public view virtual returns (address) {
        address baseToken = nftxVaultFactory.vault(vaultId);
        address xToken = xTokenAddr(baseToken);
        require(isContract(xToken), "XToken not deployed");
        return xToken;
    } 

    function _timelockMintFor(uint256 vaultId, address account, uint256 _amount, uint256 timelockLength) internal returns (IERC20Upgradeable, XTokenUpgradeable, uint256) {
        deployXTokenForVault(vaultId);
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable((xTokenAddr(address(baseToken))));

        uint256 xTokensMinted = xToken.mintXTokens(account, _amount, timelockLength);
        return (baseToken, xToken, xTokensMinted);
    }

    // Assumes its paired with the default pair.
    function _deployXToken(address vaultToken) internal returns (address) {
        string memory symbol = IERC20Metadata(vaultToken).symbol();
        string memory pairSymbol = IERC20Metadata(defaultPair).symbol();
        symbol = string(abi.encodePacked("x", symbol, pairSymbol));
        bytes32 salt = keccak256(abi.encodePacked(vaultToken, defaultPair));
        address deployedXToken = Create2.deploy(0, salt, beaconCode);
        XTokenUpgradeable(deployedXToken).__XToken_init(vaultToken, symbol, symbol);
        return deployedXToken;
    }

    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size != 0;
    }
}
