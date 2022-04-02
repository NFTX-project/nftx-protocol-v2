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
    uint256 private NOT_USED1; // Removed, no longer needed.
    address public override zapContract; // No longer needed, but keeping for compatibility.
    address public override feeDistributor;
    address public override eligibilityManager;

    mapping(uint256 => address) private NOT_USED3; // Removed, no longer needed.
    mapping(address => address[]) _vaultsForAsset;
    
    address[] internal vaults;

    // v1.0.1
    mapping(address => bool) public override excludedFromFees;

    // v1.0.2
    struct VaultFees {
        bool active;
        uint64 mintFee;
        uint64 randomRedeemFee;
        uint64 targetRedeemFee;
        uint64 randomSwapFee;
        uint64 targetSwapFee;
    }
    mapping(uint256 => VaultFees) private _vaultFees;
    uint64 public override factoryMintFee;
    uint64 public override factoryRandomRedeemFee;
    uint64 public override factoryTargetRedeemFee;
    uint64 public override factoryRandomSwapFee;
    uint64 public override factoryTargetSwapFee;

    uint256 public configsLength;
    uint256 public constant FACTORY_FEE_CONFIG = 0;
    struct VaultFeeConfig {
        bool active;
        uint32 mintFee;
        uint32 randomRedeemFee;
        uint32 targetRedeemFee;
        uint32 randomSwapFee;
        uint32 targetSwapFee;
    }
    mapping(uint256 => VaultFeeConfig) private feeConfig;
    mapping(uint256 => uint256) public vaultToFeeConfig;

    mapping(uint256 => address) public excludedFromFeesForVault;

    function __NFTXVaultFactory_init(address _vaultImpl, address _feeDistributor) public override initializer {
        __Pausable_init();
        // We use a beacon proxy so that every child contract follows the same implementation code.
        __UpgradeableBeacon__init(_vaultImpl);
        setFeeDistributor(_feeDistributor);
        setFactoryFees(0.1 ether, 0.04 ether, 0.06 ether, 0.04 ether, 0.06 ether);
    }

    function migrateVaultFeeToConfig(uint256 vaultId) public {
        
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
        uint256 _vaultId = vaults.length;
        _vaultsForAsset[_assetAddress].push(vaultAddr);
        vaults.push(vaultAddr);
        INFTXFeeDistributor(feeDistributor).initializeVaultReceivers(_vaultId);
        emit NewVault(_vaultId, vaultAddr, _assetAddress);
        return _vaultId;
    }

    function createFeeConfig(
        uint256 mintFee, 
        uint256 randomRedeemFee, 
        uint256 targetRedeemFee,
        uint256 randomSwapFee, 
        uint256 targetSwapFee
    ) public onlyOwner virtual {
        _createConfig(mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee);
    }

    function setFactoryFees(
        uint256 mintFee, 
        uint256 randomRedeemFee, 
        uint256 targetRedeemFee,
        uint256 randomSwapFee, 
        uint256 targetSwapFee
    ) public onlyOwner virtual override {
        require(mintFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomSwapFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetSwapFee <= 0.5 ether, "Cannot > 0.5 ether");

        // Compress to gwei but preserve ether units due to infrastructure. 
        feeConfig[FACTORY_FEE_CONFIG] = VaultFeeConfig(
            uint32(mintFee/1 gwei),
            uint32(randomRedeemFee/1 gwei),
            uint32(targetRedeemFee/1 gwei),
            uint32(randomSwapFee/1 gwei), 
            uint32(targetSwapFee/1 gwei),
            true
        );

        emit UpdateFactoryFees(mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee);
    }

    function setVaultFees(
        uint256 vaultId, 
        uint256 mintFee, 
        uint256 randomRedeemFee, 
        uint256 targetRedeemFee,
        uint256 randomSwapFee, 
        uint256 targetSwapFee
    ) public virtual override {
        // Check exisint config for vault?
        if (msg.sender != owner()) {
            address vaultAddr = vaults[vaultId];
            require(msg.sender == vaultAddr, "Not from vault");
        }
        uint256 configId = _createConfig(mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee);
        vaultToFeeConfig[vaultId] = configId;
        emit SetConfigForVault(vaultId, configId);
    }

    function setVaultFeeConfig(
        uint256 vaultId, 
        uint256 feeConfigId
    ) public virtual {
        require(feeConfigId < configCounter, "Config ID doesn't exist");
        // Check exisint config for vault?
        if (msg.sender != owner()) {
            address vaultAddr = vaults[vaultId];
            require(msg.sender == vaultAddr, "Not from vault");
        }
        vaultToFeeConfig[vaultId] = feeConfigId;
        // emit UpdateVaultFees(vaultId, mintFee, randomRedeemFee, targetRedeemFee, randomSwapFee, targetSwapFee);
    }

    function disableVaultFees(uint256 vaultId) public virtual override {
        if (msg.sender != owner()) {
            address vaultAddr = vaults[vaultId];
            require(msg.sender == vaultAddr, "Not vault");
        }
        delete vaultToFeeConfig[vaultId];
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

    function vaultFees(uint256 vaultId) external view virtual override returns (uint256, uint256, uint256, uint256, uint256) {
        uint256 vaultConfigId = vaultToFeeConfig[vaultId];
        if (vaultConfigId != FACTORY_FEE_CONFIG) {
            VaultFeeConfig memory fees = feeConfig[vaultConfigId];
            if (fees.active) {
                return (
                    uint256(fees.mintFee) * 1 gwei, 
                    uint256(fees.randomRedeemFee) * 1 gwei, 
                    uint256(fees.targetRedeemFee) * 1 gwei, 
                    uint256(fees.randomSwapFee) * 1 gwei, 
                    uint256(fees.targetSwapFee) * 1 gwei
                );
            }
        }

        VaultFeeConfig memory factoryFees = feeConfig[FACTORY_FEE_CONFIG];
        return (uint256(factoryFees.mintFee), uint256(factoryFees.randomRedeemFee), uint256(factoryFees.targetRedeemFee), uint256(factoryFees.randomSwapFee), uint256(factoryFees.targetSwapFee));
    }

    function isLocked(uint256 lockId) external view override virtual returns (bool) {
        return isPaused[lockId];
    }

    function vaultsForAsset(address assetAddress) external view override virtual returns (address[] memory) {
        return _vaultsForAsset[assetAddress];
    }

    function vault(uint256 vaultId) external view override virtual returns (address) {
        return vaults[vaultId];
    }

    function allVaults() external view override virtual returns (address[] memory) {
        return vaults;
    }

    function numVaults() external view override virtual returns (uint256) {
        return vaults.length;
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

    function createFeeConfig(
        uint256 mintFee, 
        uint256 randomRedeemFee, 
        uint256 targetRedeemFee,
        uint256 randomSwapFee, 
        uint256 targetSwapFee
    ) internal virtual returns (uint256) {
        require(mintFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetRedeemFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(randomSwapFee <= 0.5 ether, "Cannot > 0.5 ether");
        require(targetSwapFee <= 0.5 ether, "Cannot > 0.5 ether");

        // Incrementing here so configs start at 1.
        uint256 _counter = configCounter + 1; 
        configCounter = _counter;
        feeConfig[configCounter] = VaultFeeConfig(
            uint32(mintFee/1 gwei),
            uint32(randomRedeemFee/1 gwei),
            uint32(targetRedeemFee/1 gwei),
            uint32(randomSwapFee/1 gwei), 
            uint32(targetSwapFee/1 gwei),
            true
        );

        // EVENT HERE

        return _counter;
    }
}
