# Solidity API

## NFTXEligibilityManager

Handles our mappings and information for our `NFTXEligibility` contracts.

An eligibility contract allows NFTX vaults to apply one-to-one eligibility checks
against tokens that are set to be stored. It offers the ability to extend upon a
common eligibility contract interface to have access to calculate a boolean output
for if the tokenId(s) is/are eligible for the vault.

This interface also gives us access to a number of hooks to allow additional processing
to be called, required assertions to be made, or events to be triggered.

- beforeMintHook(uint256[] calldata tokenIds)
- afterMintHook(uint256[] calldata tokenIds)
- beforeRedeemHook(uint256[] calldata tokenIds)
- afterRedeemHook(uint256[] calldata tokenIds)

An eligibility module can only be deployed by the contract owner of the Eligibility
Manager contract, though at a vault level it can be applied by any priviliged user.
For more information on what defines a priviliged user, please refer to the
`onlyPrivileged` modifier in the `NFTXVaultUpgradeable` contract.

If no eligibility module is set against a vault, then it will always assume that the
NFT is eligible, resulting in the NFT transfer always being allowed.

Please note that the eligibility modules will only affect NFTs that are sent in the
correct, expected journey; by calling `receiveNFTs` on the vault.

_Our eligibility contracts are stored under `./eligibility`._

### EligibilityModule

```solidity
struct EligibilityModule {
  address implementation;
  address targetAsset;
  string name;
}
```

### modules

```solidity
struct NFTXEligibilityManager.EligibilityModule[] modules
```

Storage of all eligibility modules

### ModuleAdded

```solidity
event ModuleAdded(address implementation, address targetAsset, string name, bool finalizedOnDeploy)
```

Emitted when a module has been added

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of the eligibility module |
| targetAsset | address | The asset contract being interrogated |
| name | string | The name given to the eligibility module |
| finalizedOnDeploy | bool | If the eligibility module has been finalized |

### ModuleUpdated

```solidity
event ModuleUpdated(address implementation, string name, bool finalizedOnDeploy)
```

Emitted when a module has been updated

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of the eligibility module |
| name | string | The name given to the eligibility module |
| finalizedOnDeploy | bool | If the eligibility module has been finalized |

### __NFTXEligibilityManager_init

```solidity
function __NFTXEligibilityManager_init() public
```

Initialiser for the eligibility manager.

_Allows for upgradable deployment_

### addModule

```solidity
function addModule(address implementation) external
```

Adds an address that supports `INFTXEligibility` to our array of `EligibilityModule`.

| Name | Type | Description |
| ---- | ---- | ----------- |
| implementation | address | The address of an implementation that supports `INFTXEligibility` |

### updateModule

```solidity
function updateModule(uint256 moduleIndex, address implementation) external
```

Allows an existing implementation to be updated.

| Name | Type | Description |
| ---- | ---- | ----------- |
| moduleIndex | uint256 | The array index of the implementation to be updated |
| implementation | address | The address of an implementation that supports `INFTXEligibility` |

### deployEligibility

```solidity
function deployEligibility(uint256 moduleIndex, bytes configData) external virtual returns (address)
```

Creates a cloned version of the specified implementation, using
the provided `configData`. This allows multiple instances of the same
eligibility module to be deployed, with varied constructor data.

_Our `configData` is an encoded abi that will be required to match
against the expected, individual eligility module referenced. The specific
encoding will be found in the respective `__NFTXEligibility_init_bytes`
function._

| Name | Type | Description |
| ---- | ---- | ----------- |
| moduleIndex | uint256 | The array index of the implementation to be updated |
| configData | bytes | Encoded abi bytes that represents keyword arguements |

### allModules

```solidity
function allModules() external view returns (struct NFTXEligibilityManager.EligibilityModule[])
```

Returns our array of modules.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct NFTXEligibilityManager.EligibilityModule[] | EligibilityModule[] |

### allModuleNames

```solidity
function allModuleNames() external view returns (string[])
```

Returns a list of all module names from our stored array.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | string[] | Array of module names |

