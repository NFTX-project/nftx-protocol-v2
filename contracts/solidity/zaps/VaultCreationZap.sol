// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../interface/INFTXInventoryStaking.sol";
import "../interface/INFTXLPStaking.sol";
import "../interface/IUniswapV2Router01.sol";
import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "../token/IERC1155Upgradeable.sol";
import "../token/ERC1155SafeHolderUpgradeable.sol";
import "../util/Ownable.sol";
import "../util/ReentrancyGuard.sol";
import "../util/SafeERC20Upgradeable.sol";
import "../util/SushiHelper.sol";


/**
 * @notice A partial WETH interface.
 */

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
  function balanceOf(address to) external view returns (uint256);
  function approve(address guy, uint wad) external returns (bool);
}


/**
 * @notice An amalgomation of vault creation steps, merged and optimised in
 * a single contract call in an attempt reduce gas costs to the end-user.
 * 
 * @author Twade
 */

contract NFTXVaultCreationZap is Ownable, ReentrancyGuard, ERC1155SafeHolderUpgradeable {

  using SafeERC20Upgradeable for IERC20Upgradeable;

  /// @notice Allows zap to be paused
  bool public paused = false;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable vaultFactory;

  /// @notice Holds the mapping of our sushi router
  IUniswapV2Router01 public immutable sushiRouter;
  SushiHelper internal immutable sushiHelper;

  /// @notice An interface for the WETH contract
  IWETH public immutable WETH;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXInventoryStaking public immutable inventoryStaking;
  INFTXLPStaking public immutable lpStaking;

  /// @notice Basic information pertaining to the vault
  struct vaultInfo {
    address assetAddress;      // 20/32
    bool is1155;               // 21/32
    bool allowAllItems;        // 22/32
    string name;               // ??/32
    string symbol;             // ??/32
  }

  /// @notice Fee information in 9-decimal format
  struct vaultFeesConfig {
    uint32 mintFee;
    uint32 randomRedeemFee;
    uint32 targetRedeemFee;
    uint32 randomSwapFee;
    uint32 targetSwapFee;
  }

  /// @notice Reference to the vault's eligibility implementation
  struct vaultEligibilityStorage {
    int moduleIndex;
    bytes initData;
  }

  /// @notice Valid tokens to be transferred to the vault on creation
  struct vaultTokens {
    uint[] assetTokenIds;
    uint[] assetTokenAmounts;

    // Sushiswap integration for liquidity
    uint minTokenIn;
    uint minWethIn;
    uint wethIn;
  }


  /**
   * @notice Initialises our zap by setting contract addresses onto their
   * respective interfaces.
   */

  constructor(
    address _vaultFactory,
    address _inventoryStaking,
    address _lpStaking,
    address _sushiRouter,
    address _sushiHelper,
    address _weth
  ) Ownable() ReentrancyGuard() {
    // Set our staking contracts
    inventoryStaking = INFTXInventoryStaking(_inventoryStaking);
    lpStaking = INFTXLPStaking(_lpStaking);

    // Set our NFTX factory contract
    vaultFactory = INFTXVaultFactory(_vaultFactory);

    // Set our Sushi Router used for liquidity
    sushiRouter = IUniswapV2Router01(_sushiRouter);
    sushiHelper = SushiHelper(_sushiHelper);

    // Set our chain's WETH contract
    WETH = IWETH(_weth);
    // setting infinite approval here to save on subsequent gas costs
    WETH.approve(_sushiRouter, type(uint256).max);
  }


  /**
   * @notice Creates an NFTX vault, handling any desired settings and tokens.
   * 
   * @dev Tokens are deposited into the vault prior to fees being sent.
   * 
   * @param vaultData Basic information about the vault stored in `vaultInfo` struct
   * @param vaultFeatures A numeric representation of boolean values for features on the vault
   * @param vaultFees Fee definitions stored in a `vaultFeesConfig` struct
   * @param eligibilityStorage Eligibility implementation, stored in a `vaultEligibilityStorage` struct
   * @param assetTokens Tokens to be transferred to the vault in exchange for vault tokens
   * 
   * @return vaultId_ The numeric ID of the NFTX vault
   */

  function createVault(
    vaultInfo calldata vaultData,
    uint vaultFeatures,
    vaultFeesConfig calldata vaultFees,
    vaultEligibilityStorage calldata eligibilityStorage,
    vaultTokens calldata assetTokens
  ) external nonReentrant payable returns (uint vaultId_) {
    // Ensure our zap is not paused
    require(!paused, 'Zap is paused');

    // Get the amount of starting ETH in the contract
    uint startingWeth = WETH.balanceOf(address(this));

    // Create our vault skeleton
    vaultId_ = vaultFactory.createVault(
      vaultData.name,
      vaultData.symbol,
      vaultData.assetAddress,
      vaultData.is1155,
      vaultData.allowAllItems
    );

    // Deploy our vault's xToken
    inventoryStaking.deployXTokenForVault(vaultId_);

    // Build our vault interface
    INFTXVault vault = INFTXVault(vaultFactory.vault(vaultId_));

    // If we have a specified eligibility storage, add that on
    if (eligibilityStorage.moduleIndex >= 0) {
      vault.deployEligibilityStorage(
        uint256(eligibilityStorage.moduleIndex),
        eligibilityStorage.initData
      );
    }

    // Mint and stake liquidity into the vault
    uint length = assetTokens.assetTokenIds.length;

    // If we don't have any tokens to send, we can skip our transfers
    if (length > 0) {
      // Determine the token type to alternate our transfer logic
      if (!vaultData.is1155) {
        // Iterate over our 721 tokens to transfer them all to our vault
        for (uint i; i < length;) {
          _transferFromERC721(vaultData.assetAddress, assetTokens.assetTokenIds[i], address(vault));
          unchecked { ++i; }
        }
      } else {
        // Transfer all of our 1155 tokens to our zap, as the `mintTo` call on our
        // vault requires the call sender to hold the ERC1155 token.
        IERC1155Upgradeable(vaultData.assetAddress).safeBatchTransferFrom(
          msg.sender,
          address(this),
          assetTokens.assetTokenIds,
          assetTokens.assetTokenAmounts,
          ""
        );

        // Approve our vault to play with our 1155 tokens
        IERC1155Upgradeable(vaultData.assetAddress).setApprovalForAll(address(vault), true);
      }

      // We can now mint our asset tokens, giving the vault our tokens and storing them
      // inside our zap, as we will shortly be staking them. Our zap is excluded from fees,
      // so there should be no loss in the amount returned.
      vault.mintTo(assetTokens.assetTokenIds, assetTokens.assetTokenAmounts, address(this));

      // We now have tokens against our provided NFTs that we can now stake through either
      // inventory or liquidity.

      // Get our vaults base staking token. This is used to calculate the xToken
      address baseToken = address(vault);

      // We first want to set up our liquidity, as the returned values will be variable
      if (assetTokens.minTokenIn > 0) {
        require(msg.value > assetTokens.wethIn, 'Insufficient vault sent for liquidity');

        // Wrap ETH into WETH for our contract from the sender
        WETH.deposit{value: msg.value}();

        // Convert WETH to vault token
        require(IERC20Upgradeable(baseToken).balanceOf(address(this)) >= assetTokens.minTokenIn, 'Insufficient tokens acquired for liquidity');

        // Provide liquidity to sushiswap, using the vault tokens and pairing it with the
        // liquidity amount specified in the call.
        IERC20Upgradeable(baseToken).safeApprove(address(sushiRouter), assetTokens.minTokenIn);
        (,, uint256 liquidity) = sushiRouter.addLiquidity(
          baseToken,
          address(WETH),
          assetTokens.minTokenIn,
          assetTokens.wethIn,
          assetTokens.minTokenIn,
          assetTokens.minWethIn,
          address(this),
          block.timestamp
        );
        IERC20Upgradeable(baseToken).safeApprove(address(sushiRouter), 0);

        // Stake in LP rewards contract 
        address lpToken = sushiHelper.pairFor(sushiRouter.factory(), baseToken, address(WETH));
        IERC20Upgradeable(lpToken).safeApprove(address(lpStaking), liquidity);
        lpStaking.timelockDepositFor(vaultId_, msg.sender, liquidity, 48 hours);
      }

      // Return any token dust to the caller
      uint256 remainingTokens = IERC20Upgradeable(baseToken).balanceOf(address(this));

      // Any tokens that we have remaining after our liquidity staking are thrown into
      // inventory to ensure what we don't have any token dust remaining.
      if (remainingTokens > 0) {
        // Make a direct timelock mint using the default timelock duration. This sends directly
        // to our user, rather than via the zap, to avoid the timelock locking the tx.
        IERC20Upgradeable(baseToken).transfer(inventoryStaking.vaultXToken(vaultId_), remainingTokens);
        inventoryStaking.timelockMintFor(vaultId_, remainingTokens, msg.sender, 2);
      }
    }

    // If we have specified vault features that aren't the default (all enabled)
    // then update them
    if (vaultFeatures < 31) {
      vault.setVaultFeatures(
        _getBoolean(vaultFeatures, 4),
        _getBoolean(vaultFeatures, 3),
        _getBoolean(vaultFeatures, 2),
        _getBoolean(vaultFeatures, 1),
        _getBoolean(vaultFeatures, 0)
      );
    }

    // Set our vault fees, converting our 9-decimal to 18-decimal
    vault.setFees(
      uint256(vaultFees.mintFee) * 10e9,
      uint256(vaultFees.randomRedeemFee) * 10e9,
      uint256(vaultFees.targetRedeemFee) * 10e9,
      uint256(vaultFees.randomSwapFee) * 10e9,
      uint256(vaultFees.targetSwapFee) * 10e9
    );

    // Finalise our vault, preventing further edits
    vault.finalizeVault();

    // Now that all transactions are finished we can return any ETH dust left over
    // from our liquidity staking.
    uint remainingWEth = WETH.balanceOf(address(this)) - startingWeth;
    if (remainingWEth > 0) {
      WETH.withdraw(remainingWEth);
      bool sent = payable(msg.sender).send(remainingWEth);
      require(sent, "Failed to send Ether");
    }
  }


  /**
   * @notice Transfers our ERC721 tokens to a specified recipient.
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function _transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    bytes memory data;

    if (assetAddr == 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB) {
      // Fix here for frontrun attack.
      bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", tokenId);
      (bool checkSuccess, bytes memory result) = address(assetAddr).staticcall(punkIndexToAddress);
      (address nftOwner) = abi.decode(result, (address));
      require(checkSuccess && nftOwner == msg.sender, "Not the NFT owner");
      data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
    } else {
      // We push to the vault to avoid an unneeded transfer.
      data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", msg.sender, to, tokenId);
    }

    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }


  /**
   * @notice Reads a boolean at a set character index of a uint.
   * 
   * @dev 0 and 1 define false and true respectively.
   * 
   * @param _packedBools A numeric representation of a series of boolean values
   * @param _boolNumber The character index of the boolean we are looking up
   *
   * @return bool The representation of the boolean value
   */

  function _getBoolean(uint256 _packedBools, uint256 _boolNumber) internal pure returns(bool) {
    uint256 flag = (_packedBools >> _boolNumber) & uint256(1);
    return (flag == 1 ? true : false);
  }


  /**
   * @notice Allows our zap to be paused to prevent any processing.
   * 
   * @param _paused New pause state
   */

  function pause(bool _paused) external onlyOwner {
    paused = _paused;
  }

  receive() external payable {
    require(msg.sender == address(WETH), "Only WETH");
  }

}
