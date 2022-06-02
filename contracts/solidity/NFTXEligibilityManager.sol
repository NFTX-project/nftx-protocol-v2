// SPDX-License-Identifier: MIT

pragma experimental ABIEncoderV2;
pragma solidity ^0.8.0;

import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXEligibility.sol";
import "./util/OwnableUpgradeable.sol";
import "./proxy/ClonesUpgradeable.sol";


/**
 * @title NFTX Eligibility Manager
 * @author The NFTX Team
 * 
 * @notice Handles our mappings and information for our `NFTXEligibility` contracts.
 */

contract NFTXEligibilityManager is OwnableUpgradeable {

    /**
     * @notice Structure of an Eligibility Module that contains all information required
     * to map an implementation to a target asset.
     * 
     * @member implementation Address of an implementation that supports `INFTXEligibility`
     * @member targetAsset The asset that the `implementation` will be eligible for
     * @member name Name used to a textual reference
     */

    struct EligibilityModule {
        address implementation;
        address targetAsset;
        string name;
    }


    /// @notice Storage of all eligibility modules
    EligibilityModule[] public modules;


    /// @notice Emitted when a module has been added
    /// @param implementation TODO
    /// @param targetAsset TODO
    /// @param name TODO
    /// @param finalizedOnDeploy TODO
    event ModuleAdded(
        address implementation,
        address targetAsset,
        string name,
        bool finalizedOnDeploy
    );

    /// @notice Emitted when a module has been updated
    /// @param implementation TODO
    /// @param name TODO
    /// @param finalizedOnDeploy TODO
    event ModuleUpdated(
        address implementation,
        string name,
        bool finalizedOnDeploy
    );


    /**
     * @notice Initialiser for the eligibility manager.
     * 
     * @dev Allows for upgradable deployment
     */

    function __NFTXEligibilityManager_init() public initializer {
        __Ownable_init();
    }


    /**
     * @notice Adds an address that supports `INFTXEligibility` to our array of `EligibilityModule`.
     *
     * @param implementation The address of an implementation that supports `INFTXEligibility`
     */

    function addModule(address implementation) external onlyOwner {
        require(implementation != address(0), "Impl != address(0)");
        INFTXEligibility elig = INFTXEligibility(implementation);
        string memory name = elig.name();
        EligibilityModule memory module = EligibilityModule(
            implementation,
            elig.targetAsset(),
            name
        );
        modules.push(module);
        emit ModuleAdded(
            implementation,
            module.targetAsset,
            name,
            elig.finalized()
        );
    }


    /**
     * @notice Allows an existing implementation to be updated.
     *
     * @param moduleIndex The array index of the implementation to be updated
     * @param implementation The address of an implementation that supports `INFTXEligibility`
     */

    function updateModule(uint256 moduleIndex, address implementation)
        external
        onlyOwner
    {
        require(moduleIndex < modules.length, "Out of bounds");
        require(implementation != address(0), "Impl != address(0)");
        modules[moduleIndex].implementation = implementation;
        INFTXEligibility elig = INFTXEligibility(implementation);
        emit ModuleUpdated(implementation, elig.name(), elig.finalized());
    }


    /**
     * @notice TODO
     *
     * @param moduleIndex The array index of the implementation to be updated
     * @param configData TODO
     */

    function deployEligibility(uint256 moduleIndex, bytes calldata configData)
        external
        virtual
        returns (address)
    {
        require(moduleIndex < modules.length, "Out of bounds");
        address eligImpl = modules[moduleIndex].implementation;
        address eligibilityClone = ClonesUpgradeable.clone(eligImpl);
        INFTXEligibility(eligibilityClone).__NFTXEligibility_init_bytes(
            configData
        );
        return eligibilityClone;
    }


    /**
     * @notice Returns our array of modules.
     *
     * @return EligibilityModule[]
     */

    function allModules() external view returns (EligibilityModule[] memory) {
        return modules;
    }


    /**
     * @notice Returns a list of all module names from our stored array.
     *
     * @param string[] Array of module names
     */

    function allModuleNames() external view returns (string[] memory) {
        EligibilityModule[] memory modulesCopy = modules;
        string[] memory names = new string[](modulesCopy.length);
        for (uint256 i = 0; i < modulesCopy.length; i++) {
            names[i] = modulesCopy[i].name;
        }
        return names;
    }
}
