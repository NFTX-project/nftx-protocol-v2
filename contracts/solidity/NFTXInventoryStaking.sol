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
import "./interface/ITimelockExcludeList.sol";


/**
 * @title NFTX Inventory Staking
 * @author 0xKiwi
 */

contract NFTXInventoryStaking is PausableUpgradeable, UpgradeableBeacon, INFTXInventoryStaking {

    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @notice Defines a locktime in seconds to prevent flash deposits
    uint256 internal constant DEFAULT_LOCKTIME = 2;

    /// @notice TODO
    bytes internal constant beaconCode = type(Create2BeaconProxy).creationCode;

    /// @notice Contract address of the NFTX Vault Factory contract
    INFTXVaultFactory public override nftxVaultFactory;

    /// @notice TODO
    uint256 public inventoryLockTimeErc20;

    /// @notice TODO
    ITimelockExcludeList public timelockExcludeList;

    /// @notice Emitted when an xToken is created.
    /// @param vaultId NFTX Vault ID
    /// @param baseToken Address of the base token
    /// @param xToken Address of the created xToken
    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);

    /// @notice Emitted when tokens are deposited into the vault.
    /// @param vaultId NFTX Vault ID
    /// @param baseTokenAmount Amount of base token deposited
    /// @param xTokenAmount Amount of xToken deposited
    /// @param timelockUntil The duration of the timelock
    /// @param sender The address of the depositor
    event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender);

    /// @notice Emitted when tokens are withdrawn from the vault.
    /// @param vaultId NFTX Vault ID
    /// @param baseTokenAmount Amount of base token deposited withdrawn
    /// @param xTokenAmount Amount of xToken deposited withdrawn
    /// @param sender The address of the withdrawer
    event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender);

    /// @notice Emitted when fees are received by the contract.
    /// @param vaultId NFTX Vault ID
    /// @param amount The amount of tokens received
    event FeesReceived(uint256 vaultId, uint256 amount);


    /**
     * @notice Sets up the NFTX Inventory Staking contract, applying our NFTX vault contract
     * reference and creates an xToken implementation for the contract and initiates it.
     * 
     * @dev Allows for upgradable deployment
     *
     * @param _nftxVaultFactory Address of our NFTX Vault Factory contract
     */

    function __NFTXInventoryStaking_init(address _nftxVaultFactory) external virtual override initializer {
        __Ownable_init();
        nftxVaultFactory = INFTXVaultFactory(_nftxVaultFactory);
        address xTokenImpl = address(new XTokenUpgradeable());
        __UpgradeableBeacon__init(xTokenImpl);
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
     * @notice Allows the timelock exclusion list contract address reference to be updated.
     *
     * @param addr Set the address of the timelock exclusion list contract
     */

    function setTimelockExcludeList(address addr) external onlyOwner {
        timelockExcludeList = ITimelockExcludeList(addr);
    }


    /**
     * @notice Allows the timelock duration to be updated.
     *
     * @dev This new timelock duration must be shorter than 14 days.
     * 
     * @param time New duration of the timelock in seconds
     */

    function setInventoryLockTimeErc20(uint256 time) external onlyOwner {
        require(time <= 14 days, "Lock too long");
        inventoryLockTimeErc20 = time;
    }


    /**
     * @notice Check if an asset for a vault is currently timelocked and should be excluded
     * from being staked.
     *
     * @param addr Address of the token
     * @param vaultId ID of the NFTX vault
     * 
     * @return Boolean if the address is excluded from the timelock
     */

    function isAddressTimelockExcluded(address addr, uint256 vaultId) public view returns (bool) {
        if (address(timelockExcludeList) == address(0)) {
            return false;
        } else {
            return timelockExcludeList.isExcluded(addr, vaultId);
        }
    }


    /**
     * @notice Deploys an xToken for an NFTX vault, based on the vaultId provided. Further
     * details on the deployment flow for a token is defined under `_deployXToken`.
     *
     * @dev If the xToken address already exists for the vault, then a duplicate token will not
     * be deployed, but there will still be a gas cost incurred.
     * 
     * @param vaultId ID of the NFTX vault
     */

    function deployXTokenForVault(uint256 vaultId) public virtual override {
        address baseToken = nftxVaultFactory.vault(vaultId);
        address deployedXToken = xTokenAddr(address(baseToken));

        if (isContract(deployedXToken)) {
            return;
        }

        address xToken = _deployXToken(baseToken);
        emit XTokenCreated(vaultId, baseToken, xToken);
    }


    /**
     * @notice Allows our fee ditributor to call this function in order to trigger rewards to be
     * pulled into the contract. We don't distribute rewards unless there are people to distribute to
     * and if the distribution token is not deployed, the rewards are forfeited.
     *
     * @dev We "pull" to the dividend tokens so the fee distributor only needs to approve this
     * contract.
     * 
     * @param vaultId ID of the NFTX vault that owns the tokens
     * @param amount The number of tokens that should be sent
     * 
     * @return If xTokens were transferred successfully
     */

    function receiveRewards(uint256 vaultId, uint256 amount) external virtual override onlyAdmin returns (bool) {
        address baseToken = nftxVaultFactory.vault(vaultId);
        address deployedXToken = xTokenAddr(address(baseToken));
        
        // Don't distribute rewards unless there are people to distribute to.
        // Also added here if the distribution token is not deployed, just forfeit rewards for now.
        if (!isContract(deployedXToken) || XTokenUpgradeable(deployedXToken).totalSupply() == 0) {
            return false;
        }
        // We "pull" to the dividend tokens so the fee distributor only needs to approve this contract.
        IERC20Upgradeable(baseToken).safeTransferFrom(msg.sender, deployedXToken, amount);
        emit FeesReceived(vaultId, amount);
        return true;
    }


    /**
     * @notice Stakes minted tokens against a timelock; gets minted shares, locks base tokens in the
     * xToken contract and mints xTokens to the sender.
     *
     * @dev Pause code for inventory staking is `10`.
     * 
     * @param vaultId ID of the NFTX vault that owns the tokens
     * @param _amount The number of tokens that should be sent
     */

    function deposit(uint256 vaultId, uint256 _amount) external virtual override {
        onlyOwnerIfPaused(10);

        uint256 timelockTime = isAddressTimelockExcluded(msg.sender, vaultId) ? 0 : inventoryLockTimeErc20;

        (IERC20Upgradeable baseToken, XTokenUpgradeable xToken, uint256 xTokensMinted) = _timelockMintFor(vaultId, msg.sender, _amount, timelockTime);
        // Lock the base token in the xtoken contract
        baseToken.safeTransferFrom(msg.sender, address(xToken), _amount);
        emit Deposit(vaultId, _amount, xTokensMinted, timelockTime, msg.sender);
    }


    /**
     * @notice TODO
     *
     * @dev Must be sent by the NFTX Vault Factory zap contract and the sender must be excluded
     * from fees.
     * 
     * @param vaultId ID of the NFTX vault that owns the tokens
     * @param amount The number of tokens that should be sent
     * @param to Address that the xToken will be sent to
     * @param timelockLength Duration of the timelock in seconds
     * 
     * @return Number of xTokens minted
     */

    function timelockMintFor(uint256 vaultId, uint256 amount, address to, uint256 timelockLength) external virtual override returns (uint256) {
        onlyOwnerIfPaused(10);
        require(msg.sender == nftxVaultFactory.zapContract(), "Not staking zap");
        require(nftxVaultFactory.excludedFromFees(msg.sender), "Not fee excluded"); // important for math that staking zap is excluded from fees

        (, , uint256 xTokensMinted) = _timelockMintFor(vaultId, to, amount, timelockLength);
        emit Deposit(vaultId, amount, xTokensMinted, timelockLength, to);
        return xTokensMinted;
    }


    /**
     * @notice Allows sender to withdraw their tokens, along with any token gains generated,
     * from staking. The xTokens are burnt and the base token is sent to the sender.
     * 
     * @param vaultId ID of the NFTX vault that owns the tokens
     * @param _share The number of xTokens to be burnt
     */

    function withdraw(uint256 vaultId, uint256 _share) external virtual override {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable(xTokenAddr(address(baseToken)));

        uint256 baseTokensRedeemed = xToken.burnXTokens(msg.sender, _share);
        emit Withdraw(vaultId, baseTokensRedeemed, _share, msg.sender);
    }


    /**
     * @notice Returns the xToken share value from the vault, based on the total supply
     * of the xToken and the balance of the base token held by the xToken contract.
     * 
     * @param vaultId ID of the NFTX vault
     * 
     * @return Share value of the xToken
     */

   function xTokenShareValue(uint256 vaultId) external view virtual override returns (uint256) {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable(xTokenAddr(address(baseToken)));
        require(address(xToken) != address(0), "XToken not deployed");

        uint256 multiplier = 10 ** 18;
        return xToken.totalSupply() > 0 
            ? multiplier * baseToken.balanceOf(address(xToken)) / xToken.totalSupply() 
            : multiplier;
    }


    /**
     * @notice Returns the xToken share value from the vault, based on the total supply
     * of the xToken and the balance of the base token held by the xToken contract.
     * 
     * @param vaultId ID of the NFTX vault
     * @param who Address to check the timelock against
     * 
     * @return Number of seconds until vault timelock is lifted against an address
     */

    function timelockUntil(uint256 vaultId, address who) external view returns (uint256) {
        XTokenUpgradeable xToken = XTokenUpgradeable(vaultXToken(vaultId));
        return xToken.timelockUntil(who);
    }


    /**
     * @notice Returns the xTokens held by an address.
     * 
     * @param vaultId ID of the NFTX vault
     * @param who Address to check the balance against
     * 
     * @return The number of xTokens held by an address against a vault
     */

    function balanceOf(uint256 vaultId, address who) external view returns (uint256) {
        XTokenUpgradeable xToken = XTokenUpgradeable(vaultXToken(vaultId));
        return xToken.balanceOf(who);
    }


    /**
     * @notice Returns the corresponding xToken address for a base token.
     * 
     * @param baseToken The address of the base token
     * 
     * @return The equivalent xToken address of the base token
     */

    function xTokenAddr(address baseToken) public view virtual override returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(baseToken));
        address tokenAddr = Create2.computeAddress(salt, keccak256(type(Create2BeaconProxy).creationCode));
        return tokenAddr;
    }


    /**
     * @notice Returns the corresponding xToken address for an NFTX vault ID.
     * 
     * @param vaultId ID of the NFTX vault
     * 
     * @return The equivalent xToken address of the vault
     */

    function vaultXToken(uint256 vaultId) public view virtual override returns (address) {
        address baseToken = nftxVaultFactory.vault(vaultId);
        address xToken = xTokenAddr(baseToken);
        require(isContract(xToken), "XToken not deployed");
        return xToken;
    } 


    /**
     * @notice TODO
     * 
     * @param vaultId ID of the NFTX vault
     * @param account TODO
     * @param _amount TODO
     * @param timelockLength TODO
     * 
     * @return TODO
     * @return TODO
     * @return TODO
     */

    function _timelockMintFor(uint256 vaultId, address account, uint256 _amount, uint256 timelockLength) internal returns (IERC20Upgradeable, XTokenUpgradeable, uint256) {
        deployXTokenForVault(vaultId);
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable((xTokenAddr(address(baseToken))));

        uint256 xTokensMinted = xToken.mintXTokens(account, _amount, timelockLength);
        return (baseToken, xToken, xTokensMinted);
    }


    /**
     * @notice TODO
     * 
     * @param baseToken TODO
     * 
     * @return TODO
     */

    function _deployXToken(address baseToken) internal returns (address) {
        string memory symbol = IERC20Metadata(baseToken).symbol();
        symbol = string(abi.encodePacked("x", symbol));
        bytes32 salt = keccak256(abi.encodePacked(baseToken));
        address deployedXToken = Create2.deploy(0, salt, beaconCode);
        XTokenUpgradeable(deployedXToken).__XToken_init(baseToken, symbol, symbol);
        return deployedXToken;
    }


    /**
     * @notice Checks if the provided address is a contract.
     * 
     * @dev This method relies on extcodesize, which returns 0 for contracts in construction,
     * since the code is only stored at the end of the constructor execution.
     * 
     * @param account Address to be checked
     * 
     * @return Returns `true` if the passed address is a contract
     */

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
