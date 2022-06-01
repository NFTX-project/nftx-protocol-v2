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
import "./token/DividendNFT.sol";
import "./univ3/INonfungiblePositionManager.sol";
import "./univ3/PoolAddress.sol";

import "hardhat/console.sol";


// Author: 0xKiwi.

// Pausing codes for inventory staking are:
// 10: Deposit

contract NFTXUniV3Staking is PausableUpgradeable, DividendNFTUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Small locktime to prevent flash deposits.
    uint256 internal constant DEFAULT_LOCKTIME = 2;
    address public defaultPair;
        /// @dev The minimum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**-128
    int24 internal constant MIN_TICK = -887200;
    /// @dev The maximum tick that may be passed to #getSqrtRatioAtTick computed from log base 1.0001 of 2**128
    int24 internal constant MAX_TICK = -MIN_TICK;
    uint24 internal constant DEFAULT_FEE = 10000;

    uint256 public positionsCreated;
    address public v3Factory;
    INonfungiblePositionManager public nftManager;
    INFTXVaultFactory public nftxVaultFactory;

    mapping(uint256 => uint256) vaultV3PositionId;

    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);
    event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender);
    event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender);
    event FeesReceived(uint256 vaultId, uint256 amount);

    function __NFTXUniV3Staking_init(address _v3Factory, address _nftManager, address _defaultPair, address _nftxVaultFactory) external virtual initializer {
        __Ownable_init();
        // Amount 1 is for vault token
        // Amount 2 is for pairing token
        __DividendNFT_init("NFTX", "NFTXLP");
        nftxVaultFactory = INFTXVaultFactory(_nftxVaultFactory);
        v3Factory = _v3Factory;
        nftManager = INonfungiblePositionManager(_nftManager);
        defaultPair = _defaultPair;
    }

    modifier onlyAdmin() {
        require(msg.sender == owner() || msg.sender == nftxVaultFactory.feeDistributor(), "LPStaking: Not authorized");
        _;
    }

    function initializeUniV3Position(uint256 vaultId, uint160 sqrtPrice, uint256 amount0, uint256 amount1) public returns (uint256) {
      require(vaultV3PositionId[vaultId] == 0, "Vault V3 position exists");
      address vaultToken = nftxVaultFactory.vault(vaultId);
      PoolAddress.PoolKey memory poolKey = PoolAddress.getPoolKey(vaultToken, defaultPair, DEFAULT_FEE);
      console.log(poolKey.token0);
      console.log(poolKey.token1);
      console.log(poolKey.fee);
      address pool = nftManager.createAndInitializePoolIfNecessary(poolKey.token0, poolKey.token1, poolKey.fee, sqrtPrice);

      IERC20Upgradeable(poolKey.token0).transferFrom(msg.sender, address(this), amount0);
      IERC20Upgradeable(poolKey.token1).transferFrom(msg.sender, address(this), amount1);
      IERC20Upgradeable(poolKey.token0).approve(address(nftManager), amount0);
      IERC20Upgradeable(poolKey.token1).approve(address(nftManager), amount1);
      INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager.MintParams({
        token0: poolKey.token0,
        token1: poolKey.token1,
        fee: poolKey.fee,
        tickLower: MIN_TICK,
        tickUpper: MAX_TICK,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0,
        amount1Min: 0,
        recipient: address(this),
        deadline: block.timestamp
      });
        try nftManager.mint(params) returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) {
          vaultV3PositionId[vaultId] = tokenId;
          _mint(msg.sender, positionsCreated, vaultId, liquidity);
          positionsCreated = positionsCreated + 1;
          return tokenId;
        } catch (bytes memory reason) {
            revert(string(reason));
        }
    }

    function createStakingPositionNFT(uint256 vaultId, uint256 amount0, uint256 amount1) public returns (uint256) {
      // TODO CHECK OWNERSHIP

      (uint256 liquidityDelta, uint256 amount0, uint256 amount1) = _addLiquidityToVaultV3Position(vaultId, amount0, amount1);

      uint256 curIndex = positionsCreated;
      _mint(msg.sender, curIndex, vaultId, liquidityDelta);
      positionsCreated = curIndex + 1;
      return curIndex;
    }

    function addLiquidityToStakingPositionNFT(uint256 tokenId, uint256 amount0, uint256 amount1) public returns (uint256) {
      // TODO CHECK OWNERSHIP
      uint256 vaultId = vaultForToken(tokenId);

      (uint256 liquidityDelta, uint256 amount0, uint256 amount1) = _addLiquidityToVaultV3Position(vaultId, amount0, amount1);
      _increaseBalance(tokenId, liquidityDelta);
      
      return liquidityDelta;
    }

    function removeLiquidityFromVaultV3Position(uint256 tokenId, uint128 liquidityToRemove, uint128 amount0Max, uint128 amount1Max) public {
      // TODO CHECK OWNERSHIP
      
      uint256 vaultId = vaultForToken(tokenId);

      (uint128 liquidityDelta, uint256 amount0, uint256 amount1) = _removeLiquidityfromVaultV3Position(vaultId, msg.sender, liquidityToRemove, amount0Max, amount1Max);
      _decreaseBalance(tokenId, uint256(liquidityDelta));
    }

    function _addLiquidityToVaultV3Position(uint256 vaultId, uint256 amount0, uint256 amount1) public returns (uint256, uint256, uint256) {
      uint256 tokenId = vaultV3PositionId[vaultId];
      require(tokenId != 0, "No Vault V3 position");
      address _vaultToken = nftxVaultFactory.vault(vaultId);
      address _defaultPair = defaultPair;
      (address address0, address address1) = sortTokens(_vaultToken, _defaultPair);

      IERC20Upgradeable(address0).transferFrom(msg.sender, address(this), amount0);
      IERC20Upgradeable(address1).transferFrom(msg.sender, address(this), amount1);
      IERC20Upgradeable(address0).approve(address(nftManager), amount0);
      IERC20Upgradeable(address1).approve(address(nftManager), amount1);

      (,,,,,,, uint128 oldLiquidity,,,,) = nftManager.positions(tokenId);

      INonfungiblePositionManager.IncreaseLiquidityParams memory params = INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: tokenId,
        amount0Desired: amount0,
        amount1Desired: amount1,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
      });
      (uint256 liquidityDelta, uint256 amount0, uint256 amount1) = nftManager.increaseLiquidity(params);
      console.log(oldLiquidity);
      console.log(liquidityDelta);
      return (liquidityDelta, amount0, amount1);
    }

    function _removeLiquidityfromVaultV3Position(uint256 vaultId, address receiver, uint128 liquidityToRemove, uint128 amount0Max, uint128 amount1Max) public returns (uint128, uint256, uint256) {
      uint256 tokenId = vaultV3PositionId[vaultId];
      require(tokenId != 0, "No Vault V3 position");

      (,,,,,,, uint128 oldLiquidity,,,,) = nftManager.positions(tokenId);

      uint256 amount0;
      uint256 amount1;
      {
        INonfungiblePositionManager.DecreaseLiquidityParams memory params = INonfungiblePositionManager.DecreaseLiquidityParams({
          tokenId: tokenId,
          liquidity: liquidityToRemove,
          amount0Min: 0,
          amount1Min: 0,
          deadline: block.timestamp
        });
        nftManager.decreaseLiquidity(params);

        INonfungiblePositionManager.CollectParams memory collectParams = INonfungiblePositionManager.CollectParams({
          tokenId: tokenId,
          recipient: receiver,
          amount0Max: amount0Max,
          amount1Max: amount1Max
        });
        (amount0, amount1) = nftManager.collect(collectParams);
      }
      (,,,,,,, uint128 newLiquidity,,,,) = nftManager.positions(tokenId);

      return (oldLiquidity - newLiquidity, amount0, amount1);
    }

    function _distributeTradingFeeRewards(uint256 vaultId) internal {
        INonfungiblePositionManager.CollectParams memory params = INonfungiblePositionManager.CollectParams({
          tokenId: vaultV3PositionId[vaultId],
          recipient: address(this),
          amount0Max: type(uint128).max,
          amount1Max: type(uint128).max
        });
      (uint256 amount0, uint256 amount1) = nftManager.collect(params);
      _distributeRewards(vaultId, amount0, amount1);
    }

    function claimRewardsTo(uint256 tokenId, address receiver) public {
      require(msg.sender == ownerOf(tokenId), "Not owner");
      uint256 vaultId = vaultForToken(tokenId);
      _distributeTradingFeeRewards(vaultId);
      address _vaultToken = nftxVaultFactory.vault(vaultId);
      (address address0, address address1) = sortTokens(_vaultToken, defaultPair);
      (uint256 amount0, uint256 amount1) = _deductWithdrawableRewards(tokenId);
      IERC20Upgradeable(address0).transfer(receiver, amount0);
      IERC20Upgradeable(address1).transfer(receiver, amount1);
    }

    // NFTX fee rewards are distributed through this function.
    function receiveRewards(uint256 vaultId, uint256 amount) external virtual onlyAdmin returns (bool) {
      address _vaultToken = nftxVaultFactory.vault(vaultId);
      (address address0, address address1) = sortTokens(_vaultToken, defaultPair);
      uint256 amount0 = _vaultToken == address0 ? amount : 0;
      uint256 amount1  = _vaultToken == address1 ? amount : 0;
      _distributeRewards(vaultId, amount0, amount1);
      // We "pull" so the fee distributer only has to approved this contract once.
      // Only vault tokens wil come from this, never anything else.
      IERC20Upgradeable(_vaultToken).safeTransferFrom(msg.sender, address(this), amount);
      emit FeesReceived(vaultId, amount);
      return true;
    }

    // function timelockUntil(uint256 vaultId, address who) external view returns (uint256) {
    //     XTokenUpgradeable xToken = XTokenUpgradeable(vaultXToken(vaultId));
    //     return xToken.timelockUntil(who);
    // }

    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size != 0;
    }

     // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }
}
