// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVaultFactory.sol";
import "./interface/IRewardDistributionToken.sol";
import "./token/IERC20Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/Address.sol";
import "./proxy/ClonesUpgradeable.sol";
import "./StakingTokenProvider.sol";
import "./token/TimelockRewardDistributionTokenImpl.sol";


/**
 * @title NFTX Liquidity Pool Staking
 * @author 0xKiwi
 */

contract NFTXLPStaking is PausableUpgradeable {

    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @notice Contract address of the NFTX Vault Factory contract
    INFTXVaultFactory public nftxVaultFactory;

    /// @notice The contract that will handle token distribution for rewards
    IRewardDistributionToken public rewardDistTokenImpl;

    /// @notice 
    StakingTokenProvider public stakingTokenProvider;

    /// @notice Emitted when 
    /// @param vaultId 
    /// @param pool 
    event PoolCreated(uint256 vaultId, address pool);

    /// @notice Emitted when 
    /// @param vaultId 
    /// @param pool 
    event PoolUpdated(uint256 vaultId, address pool);

    /// @notice Emitted when 
    /// @param vaultId
    /// @param amount 
    event FeesReceived(uint256 vaultId, uint256 amount);

    /**
     * @notice 
     * 
     * @member stakingToken 
     * @member rewardToken 
     */
    struct StakingPool {
        address stakingToken;
        address rewardToken;
    }

    /// @notice Mapping of vault ID to staking pool information
    mapping(uint256 => StakingPool) public vaultStakingInfo;

    /// @notice Reward distribution token timelock implementation
    TimelockRewardDistributionTokenImpl public newTimelockRewardDistTokenImpl;


    /**
     * @notice Sets up the NFTX Liquidity Pool Staking contract, applying our NFTX staking token
     * provider and implementing a token reward distribution implementation.
     * 
     * @dev Allows for upgradable deployment
     *
     * @param _stakingTokenProvider Address of our Staking Token Provider contract
     */

    function __NFTXLPStaking__init(address _stakingTokenProvider) external initializer {
        __Ownable_init();
        require(_stakingTokenProvider != address(0), "Provider != address(0)");
        require(address(newTimelockRewardDistTokenImpl) == address(0), "Already assigned");
        stakingTokenProvider = StakingTokenProvider(_stakingTokenProvider);
        newTimelockRewardDistTokenImpl = new TimelockRewardDistributionTokenImpl();
        newTimelockRewardDistTokenImpl.__TimelockRewardDistributionToken_init(IERC20Upgradeable(address(0)), "", "");
    }


    /**
     * @notice Adds a function modifier to allow an external function to be called by either the
     * fee distributor or the contract deployer.
     */

    modifier onlyAdmin() {
        require(msg.sender == owner() || msg.sender == nftxVaultFactory.feeDistributor(), "LPStaking: Not authorized");
        _;
    }


    /**
     * @notice Allows our internal NFTX Vault Factory contract address to be updated.
     * 
     * @param newFactory Address of a `INFTXVaultFactory` implementation
     */

    function setNFTXVaultFactory(address newFactory) external onlyOwner {
        require(address(nftxVaultFactory) == address(0), "nftxVaultFactory is immutable");
        nftxVaultFactory = INFTXVaultFactory(newFactory);
    }


    /**
     * @notice Allows our internal staking token provider contract address to be updated.
     * 
     * @param newFactory Address of a `StakingTokenProvider` implementation
     */

    function setStakingTokenProvider(address newProvider) external onlyOwner {
        require(newProvider != address(0));
        stakingTokenProvider = StakingTokenProvider(newProvider);
    }


    /**
     * @notice Allows a liquidity pool to be added to an NFTX vault. This will deploy a dividend token
     * that will be used for reward distribution.
     * 
     * @param vaultId NFTX Vault ID
     */

    function addPoolForVault(uint256 vaultId) external onlyAdmin {
        require(address(nftxVaultFactory) != address(0), "LPStaking: Factory not set");
        require(vaultStakingInfo[vaultId].stakingToken == address(0), "LPStaking: Pool already exists");
        address _rewardToken = nftxVaultFactory.vault(vaultId);
        address _stakingToken = stakingTokenProvider.stakingTokenForVaultToken(_rewardToken);
        StakingPool memory pool = StakingPool(_stakingToken, _rewardToken);
        vaultStakingInfo[vaultId] = pool;
        address newRewardDistToken = _deployDividendToken(pool);
        emit PoolCreated(vaultId, newRewardDistToken);
    }


    /**
     * @notice Allows an array of vault IDs to have their liquidity pool updated. This pool should have
     * either recently or previously been created through the `addPoolForVault` call. This will allow
     * for provider changes to allow pools to subsequently be updated against vaults.
     * 
     * @param vaultId Array of NFTX Vault IDs
     */

    function updatePoolForVaults(uint256[] calldata vaultIds) external {
        uint256 length = vaultIds.length;
        for (uint256 i; i < length; ++i) {
            updatePoolForVault(vaultIds[i]);
        }
    }


    /**
     * @notice Allows a vault ID to have their liquidity pool updated. This will allow
     * for provider changes to allow pools to subsequently be updated against vaults.
     * 
     * @param vaultId NFTX Vault ID
     */

    function updatePoolForVault(uint256 vaultId) public {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        // Not letting people use this function to create new pools.
        require(pool.stakingToken != address(0), "LPStaking: Pool doesn't exist");
        address _stakingToken = stakingTokenProvider.stakingTokenForVaultToken(pool.rewardToken);
        StakingPool memory newPool = StakingPool(_stakingToken, pool.rewardToken);
        vaultStakingInfo[vaultId] = newPool;
        
        // If the pool is already deployed, ignore the update.
        address addr = address(_rewardDistributionTokenAddr(newPool));
        if (isContract(addr)) {
            return;
        }
        address newRewardDistToken = _deployDividendToken(newPool);
        emit PoolUpdated(vaultId, newRewardDistToken);
    }


    /**
     * @notice Distributes reward tokens against staking token by vault ID. Rewards are distributed
     * based on the logic outlined in the `RewardDistributionToken`.
     * 
     * @dev If the distribution token is not deployed, just forfeit rewards for now.
     * 
     * @param vaultId NFTX Vault ID
     * @param amount The amount of reward tokens to be distributed to the pool
     */

    function receiveRewards(uint256 vaultId, uint256 amount) external onlyAdmin returns (bool) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        if (pool.stakingToken == address(0)) {
            // In case the pair is updated, but not yet 
            return false;
        }
        
        TimelockRewardDistributionTokenImpl rewardDistToken = _rewardDistributionTokenAddr(pool);
        // Don't distribute rewards unless there are people to distribute to.
        // Also added here if the distribution token is not deployed, just forfeit rewards for now.
        if (!isContract(address(rewardDistToken)) || rewardDistToken.totalSupply() == 0) {
            return false;
        }
        // We "pull" to the dividend tokens so the vault only needs to approve this contract.
        IERC20Upgradeable(pool.rewardToken).safeTransferFrom(msg.sender, address(rewardDistToken), amount);
        rewardDistToken.distributeRewards(amount);
        emit FeesReceived(vaultId, amount);
        return true;
    }


    /**
     * @notice More information coming soon
     *
     * @dev Pause code for inventory staking is `10`.
     * 
     * @param vaultId ID of the NFTX vault that owns the tokens
     * @param _amount The number of tokens that should be distributed
     */

    function deposit(uint256 vaultId, uint256 amount) external {
        onlyOwnerIfPaused(10);
        // Check the pool in case its been updated.
        updatePoolForVault(vaultId);

        StakingPool memory pool = vaultStakingInfo[vaultId];
        require(pool.stakingToken != address(0), "LPStaking: Nonexistent pool");
        IERC20Upgradeable(pool.stakingToken).safeTransferFrom(msg.sender, address(this), amount);
        TimelockRewardDistributionTokenImpl xSLPToken = _rewardDistributionTokenAddr(pool);

        // If the user has an existing timelock, check if it is in the future.
        uint256 currentTimelock = xSLPToken.timelockUntil(msg.sender);
        if (currentTimelock > block.timestamp) {
            // Maintain the same timelock if they already have one.
            // We do this instead of patching in the token because
            // the xSLP contracts as currently deployed are not upgradeable.
            xSLPToken.timelockMint(msg.sender, amount, currentTimelock-block.timestamp);
        } else {
            // Timelock for 2 seconds if they don't already have a timelock to prevent flash loans.
            xSLPToken.timelockMint(msg.sender, amount, 2);
        }
    }

    function timelockDepositFor(uint256 vaultId, address account, uint256 amount, uint256 timelockLength) external {
        require(timelockLength < 2592000, "Timelock too long");
        require(nftxVaultFactory.excludedFromFees(msg.sender), "Not zap");
        onlyOwnerIfPaused(10);
        // Check the pool in case its been updated.
        updatePoolForVault(vaultId);
        StakingPool memory pool = vaultStakingInfo[vaultId];
        require(pool.stakingToken != address(0), "LPStaking: Nonexistent pool");
        IERC20Upgradeable(pool.stakingToken).safeTransferFrom(msg.sender, address(this), amount);
        _rewardDistributionTokenAddr(pool).timelockMint(account, amount, timelockLength);
    }

    function exit(uint256 vaultId) external {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        _claimRewards(pool, msg.sender);
        _withdraw(pool, balanceOf(vaultId, msg.sender), msg.sender);
    }

    function emergencyExitAndClaim(address _stakingToken, address _rewardToken) external {
        StakingPool memory pool = StakingPool(_stakingToken, _rewardToken);
        TimelockRewardDistributionTokenImpl dist = _rewardDistributionTokenAddr(pool);
        require(isContract(address(dist)), "Not a pool");
        _claimRewards(pool, msg.sender);
        _withdraw(pool, dist.balanceOf(msg.sender), msg.sender);
    }

    function emergencyExit(address _stakingToken, address _rewardToken) external {
        StakingPool memory pool = StakingPool(_stakingToken, _rewardToken);
        TimelockRewardDistributionTokenImpl dist = _rewardDistributionTokenAddr(pool);
        require(isContract(address(dist)), "Not a pool");
        _withdraw(pool, dist.balanceOf(msg.sender), msg.sender);
    }

    function emergencyMigrate(uint256 vaultId) external {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        IRewardDistributionToken unusedDist = _unusedRewardDistributionTokenAddr(pool);
        IRewardDistributionToken oldDist = _oldRewardDistributionTokenAddr(pool);

        uint256 unusedDistBal; 
        if (isContract(address(unusedDist))) {
            unusedDistBal = unusedDist.balanceOf(msg.sender);
            if (unusedDistBal > 0) {
                unusedDist.burnFrom(msg.sender, unusedDistBal);
            }
        }
        uint256 oldDistBal; 
        if (isContract(address(oldDist))) {
            oldDistBal = oldDist.balanceOf(msg.sender);
            if (oldDistBal > 0) {
                oldDist.withdrawReward(msg.sender); 
                oldDist.burnFrom(msg.sender, oldDistBal);
            }
        }
        
        TimelockRewardDistributionTokenImpl newDist = _rewardDistributionTokenAddr(pool);
        if (!isContract(address(newDist))) {
            address deployedDist = _deployDividendToken(pool);
            require(deployedDist == address(newDist), "Not deploying proper distro");
            emit PoolUpdated(vaultId, deployedDist);
        }
        require(unusedDistBal + oldDistBal > 0, "Nothing to migrate");
        newDist.mint(msg.sender, unusedDistBal + oldDistBal);
    }

    function withdraw(uint256 vaultId, uint256 amount) external {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        _claimRewards(pool, msg.sender);
        _withdraw(pool, amount, msg.sender);
    }

    function claimRewards(uint256 vaultId) public {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        _claimRewards(pool, msg.sender);
    }

    function claimMultipleRewards(uint256[] calldata vaultIds) external {
        uint256 length = vaultIds.length;
        for (uint256 i; i < length; ++i) {
            claimRewards(vaultIds[i]);
        }
    }

    function newRewardDistributionToken(uint256 vaultId) external view returns (TimelockRewardDistributionTokenImpl) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        if (pool.stakingToken == address(0)) {
            return TimelockRewardDistributionTokenImpl(address(0));
        }
        return _rewardDistributionTokenAddr(pool);
    }

   function rewardDistributionToken(uint256 vaultId) external view returns (IRewardDistributionToken) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        if (pool.stakingToken == address(0)) {
            return IRewardDistributionToken(address(0));
        }
        return _unusedRewardDistributionTokenAddr(pool);
    }

    function oldRewardDistributionToken(uint256 vaultId) external view returns (address) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        if (pool.stakingToken == address(0)) {
            return address(0);
        }
        return address(_oldRewardDistributionTokenAddr(pool));
    }

    function unusedRewardDistributionToken(uint256 vaultId) external view returns (address) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        if (pool.stakingToken == address(0)) {
            return address(0);
        }
        return address(_unusedRewardDistributionTokenAddr(pool));
    }

    function rewardDistributionTokenAddr(address stakedToken, address rewardToken) public view returns (address) {
        StakingPool memory pool = StakingPool(stakedToken, rewardToken);
        return address(_rewardDistributionTokenAddr(pool));
    }

    function balanceOf(uint256 vaultId, address addr) public view returns (uint256) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        TimelockRewardDistributionTokenImpl dist = _rewardDistributionTokenAddr(pool);
        require(isContract(address(dist)), "Not a pool");
        return dist.balanceOf(addr);
    }

    function oldBalanceOf(uint256 vaultId, address addr) public view returns (uint256) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        IRewardDistributionToken dist = _oldRewardDistributionTokenAddr(pool);
        require(isContract(address(dist)), "Not a pool");
        return dist.balanceOf(addr);
    }

    function unusedBalanceOf(uint256 vaultId, address addr) public view returns (uint256) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        IRewardDistributionToken dist = _unusedRewardDistributionTokenAddr(pool);
        require(isContract(address(dist)), "Not a pool");
        return dist.balanceOf(addr);
    }

    function lockedUntil(uint256 vaultId, address who) external view returns (uint256) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        TimelockRewardDistributionTokenImpl dist = _rewardDistributionTokenAddr(pool);
        return dist.timelockUntil(who);
    }

    function lockedLPBalance(uint256 vaultId, address who) external view returns (uint256) {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        TimelockRewardDistributionTokenImpl dist = _rewardDistributionTokenAddr(pool);
        if(block.timestamp > dist.timelockUntil(who)) {
            return 0;
        }
        return dist.balanceOf(who);
    }

    function _claimRewards(StakingPool memory pool, address account) internal {
        require(pool.stakingToken != address(0), "LPStaking: Nonexistent pool");
        _rewardDistributionTokenAddr(pool).withdrawReward(account);
    }

    function _withdraw(StakingPool memory pool, uint256 amount, address account) internal {
        require(pool.stakingToken != address(0), "LPStaking: Nonexistent pool");
        _rewardDistributionTokenAddr(pool).burnFrom(account, amount);
        IERC20Upgradeable(pool.stakingToken).safeTransfer(account, amount);
    }

    function _deployDividendToken(StakingPool memory pool) internal returns (address) {
        // Changed to use new nonces.
        bytes32 salt = keccak256(abi.encodePacked(pool.stakingToken, pool.rewardToken, uint256(2)));
        address rewardDistToken = ClonesUpgradeable.cloneDeterministic(address(newTimelockRewardDistTokenImpl), salt);
        string memory name = stakingTokenProvider.nameForStakingToken(pool.rewardToken);
        TimelockRewardDistributionTokenImpl(rewardDistToken).__TimelockRewardDistributionToken_init(IERC20Upgradeable(pool.rewardToken), name, name);
        return rewardDistToken;
    }

    // Note: this function does not guarantee the token is deployed, we leave that check to elsewhere to save gas.
    function _rewardDistributionTokenAddr(StakingPool memory pool) public view returns (TimelockRewardDistributionTokenImpl) {
        bytes32 salt = keccak256(abi.encodePacked(pool.stakingToken, pool.rewardToken, uint256(2) /* small nonce to change tokens */));
        address tokenAddr = ClonesUpgradeable.predictDeterministicAddress(address(newTimelockRewardDistTokenImpl), salt);
        return TimelockRewardDistributionTokenImpl(tokenAddr);
    }

    // Note: this function does not guarantee the token is deployed, we leave that check to elsewhere to save gas.
    function _oldRewardDistributionTokenAddr(StakingPool memory pool) public view returns (IRewardDistributionToken) {
        bytes32 salt = keccak256(abi.encodePacked(pool.stakingToken, pool.rewardToken, uint256(1)));
        address tokenAddr = ClonesUpgradeable.predictDeterministicAddress(address(rewardDistTokenImpl), salt);
        return IRewardDistributionToken(tokenAddr);
    }

    // Note: this function does not guarantee the token is deployed, we leave that check to elsewhere to save gas.
    function _unusedRewardDistributionTokenAddr(StakingPool memory pool) public view returns (IRewardDistributionToken) {
        bytes32 salt = keccak256(abi.encodePacked(pool.stakingToken, pool.rewardToken));
        address tokenAddr = ClonesUpgradeable.predictDeterministicAddress(address(rewardDistTokenImpl), salt);
        return IRewardDistributionToken(tokenAddr);
    }

    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize, which returns 0 for contracts in
        // construction, since the code is only stored at the end of the
        // constructor execution.

        uint256 size;
        // solhint-disable-next-line no-inline-assembly
        assembly { size := extcodesize(account) }
        return size > 0;
    }

    function retrieveTokens(uint256 vaultId, uint256 amount, address from, address to) public onlyOwner {
        StakingPool memory pool = vaultStakingInfo[vaultId];
        TimelockRewardDistributionTokenImpl xSlp = _rewardDistributionTokenAddr(pool);
        xSlp.burnFrom(from, amount);
        xSlp.mint(to, amount);
    }
}