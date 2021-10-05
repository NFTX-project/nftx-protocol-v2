// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXLPStaking.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./proxy/ClonesUpgradeable.sol";
import "./proxy/BeaconProxy.sol";
import "./proxy/UpgradeableBeacon.sol";
import "./util/PausableUpgradeable.sol";
import "./NFTXVaultUpgradeable.sol";

// Authors: @0xKiwi_ and @alexgausman.

contract NFTXVaultFactoryUpgradeable is
    PausableUpgradeable,
    UpgradeableBeacon,
    INFTXVaultFactory
{
    uint256 public override numVaults;
    address public override zapContract;
    address public override feeDistributor;
    address public override eligibilityManager;

    mapping(uint256 => address) public override vault;
    mapping(address => address[]) _vaultsForAsset;
    
    address[] public allVaults;

    // v1.0.1
    mapping(address => bool) public override excludedFromFees;

    // v1.0.2
    struct VaultFees {
        bool active;
        uint64 mintFee;
        uint64 randomRedeemFee;
        uint64 targetRedeemFee;
    }
    mapping(uint256 => VaultFees) private _vaultFees;
    uint64 public override factoryMintFee;
    uint64 public override factoryRandomRedeemFee;
    uint64 public override factoryTargetRedeemFee;

    function __NFTXVaultFactory_init(address _vaultImpl, address _feeDistributor) public override initializer {
        __Pausable_init();
        // We use a beacon proxy so that every child contract follows the same implementation code.
        __UpgradeableBeacon__init(_vaultImpl);
        setFeeDistributor(_feeDistributor);
        setFactoryFees(0.05 ether, 0.05 ether, 0.05 ether);
    }

    function createVault(
        string memory name,
        string memory symbol,
        address _assetAddress,
        bool is1155,
        bool allowAllItems
    ) external virtual override returns (uint256) {
        onlyOwnerIfPaused(0);
        require(feeDistributor != address(0), "NFTX: Fee receiver unset");
        require(childImplementation() != address(0), "NFTX: Vault implementation unset");
        address vaultAddr = deployVault(name, symbol, _assetAddress, is1155, allowAllItems);
        uint256 _vaultId = numVaults;
        vault[_vaultId] = vaultAddr;
        _vaultsForAsset[_assetAddress].push(vaultAddr);
        allVaults.push(vaultAddr);
        numVaults = _vaultId + 1;
        INFTXFeeDistributor(feeDistributor).initializeVaultReceivers(_vaultId);
        emit NewVault(_vaultId, vaultAddr, _assetAddress);
        return _vaultId;
    }

    function setFactoryFees(
        uint64 mintFee, 
        uint64 randomRedeemFee, 
        uint64 targetRedeemFee
    ) public onlyOwner virtual override {
        require(mintFee <= uint64(1 ether), "Cannot > 1 ether");
        require(randomRedeemFee <= uint64(1 ether), "Cannot > 1 ether");
        require(targetRedeemFee <= uint64(1 ether), "Cannot > 1 ether");

        factoryMintFee = mintFee;
        factoryRandomRedeemFee = randomRedeemFee;
        factoryTargetRedeemFee = targetRedeemFee;

        emit UpdateFactoryFees(mintFee, randomRedeemFee, targetRedeemFee);
    }

    function setVaultFees(
        uint256 vaultId, 
        uint64 mintFee, 
        uint64 randomRedeemFee, 
        uint64 targetRedeemFee
    ) public virtual override {
        if (msg.sender != owner()) {
            address vaultAddr = vault[vaultId];
            require(msg.sender == vaultAddr, "Not from vault");
        } else {
            revert("Not owner");
        }
        require(mintFee <= uint64(1 ether), "Cannot > 1 ether");
        require(randomRedeemFee <= uint64(1 ether), "Cannot > 1 ether");
        require(targetRedeemFee <= uint64(1 ether), "Cannot > 1 ether");

        _vaultFees[vaultId] = VaultFees(
            true, 
            mintFee,
            randomRedeemFee,
            targetRedeemFee
        );
        emit UpdateVaultFees(vaultId, uint256(mintFee), uint256(randomRedeemFee), uint256(targetRedeemFee));
    }

    function disableVaultFees(uint256 vaultId) public virtual override {
        if (msg.sender != owner()) {
            INFTXVault vaultAddr = INFTXVault(vault[vaultId]);
            require(msg.sender == vaultAddr.manager(), "Not vault manager");
        } else {
            revert("Not owner");
        }
        delete _vaultFees[vaultId];
        emit DisableVaultFees(vaultId);
    }

    function setFeeDistributor(address _feeDistributor) public onlyOwner virtual override {
        require(_feeDistributor != address(0));
        emit NewFeeDistributor(feeDistributor, _feeDistributor);
        feeDistributor = _feeDistributor;
    }

    function setZapContract(address _zapContract) public onlyOwner virtual override {
        emit NewZapContract(zapContract, _zapContract);
        zapContract = _zapContract;
    }

    function setFeeExclusion(address _excludedAddr, bool excluded) public onlyOwner virtual override {
        emit FeeExclusion(_excludedAddr, excluded);
        excludedFromFees[_excludedAddr] = excluded;
    }

    function setEligibilityManager(address _eligibilityManager) external onlyOwner virtual override {
        emit NewEligibilityManager(eligibilityManager, _eligibilityManager);
        eligibilityManager = _eligibilityManager;
    }

    function vaultFees(uint256 vaultId) external view virtual override returns (uint256, uint256, uint256) {
        VaultFees memory fees = _vaultFees[vaultId];
        if (fees.active) {
            return (uint256(fees.mintFee), uint256(fees.randomRedeemFee), uint256(fees.targetRedeemFee));
        }
        
        return (
            uint256(factoryMintFee),
            uint256(factoryRandomRedeemFee),
            uint256(factoryTargetRedeemFee)
        );
    }

    function isLocked(uint256 lockId) external view override virtual returns (bool) {
        return isPaused[lockId];
    }

    function vaultsForAsset(address asset) external view override virtual returns (address[] memory) {
        return _vaultsForAsset[asset];
    }
    
    function deployVault(
        string memory name,
        string memory symbol,
        address _assetAddress,
        bool is1155,
        bool allowAllItems
    ) internal returns (address) {
        address newBeaconProxy = address(new BeaconProxy(address(this), ""));
        NFTXVaultUpgradeable(newBeaconProxy).__NFTXVault_init(name, symbol, _assetAddress, is1155, allowAllItems);
        // Manager for configuration.
        NFTXVaultUpgradeable(newBeaconProxy).setManager(msg.sender);
        // Owner for administrative functions.
        NFTXVaultUpgradeable(newBeaconProxy).transferOwnership(owner());
        return newBeaconProxy;
    }
}
