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

// Author: 0xKiwi.

// Pausing codes for inventory staking are:
// 10: Deposit

contract NFTXInventoryStaking is PausableUpgradeable, UpgradeableBeacon, INFTXInventoryStaking {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Small locktime to prevent flash deposits.
    uint256 internal constant DEFAULT_LOCKTIME = 2;
    bytes internal constant beaconCode = type(Create2BeaconProxy).creationCode;

    INFTXVaultFactory public override nftxVaultFactory;

    uint256 public inventoryLockTimeErc20;
    ITimelockExcludeList public timelockExcludeList;

    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);
    event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender);
    event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender);
    event FeesReceived(uint256 vaultId, uint256 amount);

    function __NFTXInventoryStaking_init(address _nftxVaultFactory) external virtual override initializer {
        __Ownable_init();
        nftxVaultFactory = INFTXVaultFactory(_nftxVaultFactory);
        address xTokenImpl = address(new XTokenUpgradeable());
        __UpgradeableBeacon__init(xTokenImpl);
    }

    modifier onlyAdmin() {
        require(msg.sender == owner() || msg.sender == nftxVaultFactory.feeDistributor(), "LPStaking: Not authorized");
        _;
    }

    function setTimelockExcludeList(address addr) external onlyOwner {
        timelockExcludeList = ITimelockExcludeList(addr);
    }

    function setInventoryLockTimeErc20(uint256 time) external onlyOwner {
        require(time <= 14 days, "Lock too long");
        inventoryLockTimeErc20 = time;
    }

    function isAddressTimelockExcluded(address addr, uint256 vaultId) public view returns (bool) {
        if (address(timelockExcludeList) == address(0)) {
            return false;
        } else {
            return timelockExcludeList.isExcluded(addr, vaultId);
        }
    }

    function deployXTokenForVault(uint256 vaultId) public virtual override {
        address baseToken = nftxVaultFactory.vault(vaultId);
        address deployedXToken = xTokenAddr(address(baseToken));

        if (isContract(deployedXToken)) {
            return;
        }

        address xToken = _deployXToken(baseToken);
        emit XTokenCreated(vaultId, baseToken, xToken);
    }

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

    // Enter staking. Staking, get minted shares and
    // locks base tokens and mints xTokens.
    function deposit(uint256 vaultId, uint256 _amount) external virtual override {
        onlyOwnerIfPaused(10);

        uint256 timelockTime = isAddressTimelockExcluded(msg.sender, vaultId) ? 0 : inventoryLockTimeErc20;

        (IERC20Upgradeable baseToken, XTokenUpgradeable xToken, uint256 xTokensMinted) = _timelockMintFor(vaultId, msg.sender, _amount, timelockTime);
        // Lock the base token in the xtoken contract
        baseToken.safeTransferFrom(msg.sender, address(xToken), _amount);
        emit Deposit(vaultId, _amount, xTokensMinted, timelockTime, msg.sender);
    }

    function timelockMintFor(uint256 vaultId, uint256 amount, address to, uint256 timelockLength) external virtual override returns (uint256) {
        onlyOwnerIfPaused(10);
        require(msg.sender == nftxVaultFactory.zapContract(), "Not staking zap");
        require(nftxVaultFactory.excludedFromFees(msg.sender), "Not fee excluded"); // important for math that staking zap is excluded from fees

        (, , uint256 xTokensMinted) = _timelockMintFor(vaultId, to, amount, timelockLength);
        emit Deposit(vaultId, amount, xTokensMinted, timelockLength, to);
        return xTokensMinted;
    }

    // Leave the bar. Claim back your tokens.
    // Unlocks the staked + gained tokens and burns xTokens.
    function withdraw(uint256 vaultId, uint256 _share) external virtual override {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable(xTokenAddr(address(baseToken)));

        uint256 baseTokensRedeemed = xToken.burnXTokens(msg.sender, _share);
        emit Withdraw(vaultId, baseTokensRedeemed, _share, msg.sender);
    }

   function xTokenShareValue(uint256 vaultId) external view virtual override returns (uint256) {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = XTokenUpgradeable(xTokenAddr(address(baseToken)));
        require(address(xToken) != address(0), "XToken not deployed");

        uint256 multiplier = 10 ** 18;
        return xToken.totalSupply() > 0 
            ? multiplier * baseToken.balanceOf(address(xToken)) / xToken.totalSupply() 
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
    function xTokenAddr(address baseToken) public view virtual override returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(baseToken));
        address tokenAddr = Create2.computeAddress(salt, keccak256(type(Create2BeaconProxy).creationCode));
        return tokenAddr;
    }
    
    function vaultXToken(uint256 vaultId) public view virtual override returns (address) {
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

    function _deployXToken(address baseToken) internal returns (address) {
        string memory symbol = IERC20Metadata(baseToken).symbol();
        symbol = string(abi.encodePacked("x", symbol));
        bytes32 salt = keccak256(abi.encodePacked(baseToken));
        address deployedXToken = Create2.deploy(0, salt, beaconCode);
        XTokenUpgradeable(deployedXToken).__XToken_init(baseToken, symbol, symbol);
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
