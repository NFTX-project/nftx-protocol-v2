// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXVault.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/IERC20Metadata.sol";
import "./token/IERC721Upgradeable.sol";
import "./token/IERC1155Upgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";
import "./util/PausableUpgradeable.sol";
import "./util/Address.sol";
import "./util/Create2.sol";
import "./proxy/Initializable.sol";
import "./proxy/UpgradeableBeacon.sol";
import "./proxy/Create2BeaconProxy.sol";
import "./token/XTokenUpgradeable.sol";

// Author: 0xKiwi.

// Pausing codes for inventory staking are:
// 10: Deposit

contract NFTXInventoryStaking is PausableUpgradeable, UpgradeableBeacon {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint256 public constant BASE = 10**18;
    // Small locktime to prevent flash deposits.
    uint256 public constant DEFAULT_LOCKTIME = 2;

    uint256 public lockTime;

    INFTXVaultFactory public nftxVaultFactory;
    mapping(uint256 => XTokenUpgradeable) public vaultXToken;

    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);
    event Deposit(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, uint256 timelockUntil, address sender);
    event Withdraw(uint256 vaultId, uint256 baseTokenAmount, uint256 xTokenAmount, address sender);

    function __NFTXInventoryStaking__init() external initializer {
        __Ownable_init();
        address xTokenImpl = address(new XTokenUpgradeable());
        __UpgradeableBeacon__init(xTokenImpl);
    }

    modifier onlyAdmin() {
        require(msg.sender == owner() || msg.sender == nftxVaultFactory.feeDistributor(), "LPStaking: Not authorized");
        _;
    }
    
    function setNFTXVaultFactory(address newFactory) external onlyOwner {
        require(newFactory != address(0));
        nftxVaultFactory = INFTXVaultFactory(newFactory);
    }

    function deployXTokenForVault(uint256 vaultId) public {
        address baseToken = nftxVaultFactory.vault(vaultId);
        XTokenUpgradeable deployedXToken = XTokenAddr(address(baseToken));

        if (isContract(address(deployedXToken))) {
            return;
        }

        XTokenUpgradeable xToken = _deployXToken(baseToken);
        vaultXToken[vaultId] = xToken;
        emit XTokenCreated(vaultId, baseToken, address(xToken));
    }

    function receiveRewards(uint256 vaultId, uint256 amount) external onlyAdmin returns (bool) {
        address baseToken = nftxVaultFactory.vault(vaultId);
        if (address(vaultXToken[vaultId]) == address(0)) {
            // In case the xToken isnt deployed
            return false;
        }
        
        XTokenUpgradeable deployedXToken = XTokenAddr(address(baseToken));
        // Don't distribute rewards unless there are people to distribute to.
        // Also added here if the distribution token is not deployed, just forfeit rewards for now.
        if (!isContract(address(deployedXToken)) || deployedXToken.totalSupply() == 0) {
            return false;
        }
        // We "pull" to the dividend tokens so the fee distributor only needs to approve this contract.
        IERC20Upgradeable(baseToken).safeTransferFrom(msg.sender, address(deployedXToken), amount);
        return true;
    }

    function zapDeposit721(uint256 vaultId, uint256[] memory ids) public {
        deployXTokenForVault(vaultId);
        uint256 count = ids.length;
        INFTXVault vault = INFTXVault(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = vaultXToken[vaultId];
        uint256 xTokensMinted = _mintXTokens(IERC20Upgradeable(vault), xToken, msg.sender, count*BASE, 600);
        uint256 oldBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
        uint256[] memory amounts = new uint256[](0);
        IERC721Upgradeable nft = IERC721Upgradeable(vault.assetAddress());
        for (uint256 i = 0; i < ids.length; i++) {
            nft.safeTransferFrom(msg.sender, address(vault), ids[i]);
        }
        vault.mintTo(ids, amounts, address(xToken));
        uint256 newBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
        require(newBal == oldBal + count*BASE, "Not deposited");
        emit Deposit(vaultId, newBal - oldBal, xTokensMinted, 600, msg.sender);
    }

    function zapDeposit1155(uint256 vaultId, uint256[] memory ids, uint256[] memory amounts) public {
        deployXTokenForVault(vaultId);
        uint256 count = ids.length;
        INFTXVault vault = INFTXVault(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = vaultXToken[vaultId];
        uint256 xTokensMinted = _mintXTokens(IERC20Upgradeable(vault), xToken, msg.sender, count, 600);
        uint256 oldBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
        IERC1155Upgradeable nft = IERC1155Upgradeable(vault.assetAddress());
        nft.safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");
        nft.setApprovalForAll(address(vault), true);
        vault.mintTo(ids, amounts, address(xToken));
        uint256 newBal = IERC20Upgradeable(vault).balanceOf(address(xToken));
        require(newBal == oldBal + ids.length*BASE, "Not deposited");
        emit Deposit(vaultId, newBal - oldBal, xTokensMinted, 600, msg.sender);
    }

    // Enter the bar. Staking, get minted shares and .
    // Locks base tokens and mints xTokens
    function deposit(uint256 vaultId, uint256 _amount) public {
        (IERC20Upgradeable baseToken, XTokenUpgradeable xToken, uint256 xTokensMinted) = _timelockMintFor(vaultId, msg.sender, _amount, DEFAULT_LOCKTIME);
        // Lock the base token in the xtoken contract
        baseToken.safeTransferFrom(msg.sender, address(xToken), _amount);
        emit Deposit(vaultId, _amount, xTokensMinted, 600, msg.sender);
    }

    // Leave the bar. Claim back your tokens.
    // Unlocks the staked + gained tokens and burns xTokens.
    function withdraw(uint256 vaultId, uint256 _share) public {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = vaultXToken[vaultId];

        // Gets the amount of xToken in existence
        uint256 totalShares = xToken.totalSupply();
        // Calculates the amount of base tokens the xToken is worth
        uint256 what = (_share * baseToken.balanceOf(address(xToken))) / totalShares;
        xToken.burn(msg.sender, _share);
        xToken.transferBaseToken(msg.sender, what);
        emit Withdraw(vaultId, what, _share, msg.sender);
    }

   function xTokenShareValue(uint256 vaultId) external view returns (uint256) {
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = vaultXToken[vaultId];
        uint256 multiplier = 10 ** 18;
        return xToken.totalSupply() > 0 
            ? multiplier * baseToken.balanceOf(address(xToken)) / xToken.totalSupply() 
            : multiplier;
    }

    function _timelockMintFor(uint256 vaultId, address account, uint256 _amount, uint256 timelockLength) internal returns (IERC20Upgradeable, XTokenUpgradeable, uint256) {
        deployXTokenForVault(vaultId);
        IERC20Upgradeable baseToken = IERC20Upgradeable(nftxVaultFactory.vault(vaultId));
        XTokenUpgradeable xToken = vaultXToken[vaultId];

        uint256 xTokensMinted = _mintXTokens(baseToken, xToken, account, _amount, timelockLength);
        return (baseToken, xToken, xTokensMinted);
    }

    function _mintXTokens(IERC20Upgradeable baseToken, XTokenUpgradeable xToken, address account, uint256 _amount, uint256 timelockLength) internal returns (uint256) {
        // Gets the amount of Base Token locked in the contract
        uint256 totalBaseToken = baseToken.balanceOf(address(xToken));
        // Gets the amount of xTokens in existence
        uint256 totalShares = xToken.totalSupply();
        // If no xTokens exist, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalBaseToken == 0) {
            xToken.timelockMint(account, _amount, timelockLength);
            return _amount;
        } 
        // Calculate and mint the amount of xTokens the base tokens are worth. The ratio will change overtime, as xTokens are burned/minted and base tokens deposited + gained from fees / withdrawn.
        else {
            uint256 what = (_amount * totalShares) / totalBaseToken;
            xToken.timelockMint(account, what, timelockLength);
            return what;
        }
    }

    // Note: this function does not guarantee the token is deployed, we leave that check to elsewhere to save gas.
    function XTokenAddr(address vaultToken) public view returns (XTokenUpgradeable) {
        bytes32 salt = keccak256(abi.encodePacked(vaultToken));
        address tokenAddr = Create2.computeAddress(salt, keccak256(type(Create2BeaconProxy).creationCode));
        return XTokenUpgradeable(tokenAddr);
    }

    function _deployXToken(address vaultToken) internal returns (XTokenUpgradeable) {
        string memory symbol = IERC20Metadata(vaultToken).symbol();
        symbol = string(abi.encodePacked("x", symbol));
        bytes32 salt = keccak256(abi.encodePacked(vaultToken));
        address deployedXToken = Create2.deploy(0, salt, type(Create2BeaconProxy).creationCode);
        XTokenUpgradeable(deployedXToken).__XToken_init(vaultToken, symbol, symbol);
        return XTokenUpgradeable(deployedXToken);
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
}