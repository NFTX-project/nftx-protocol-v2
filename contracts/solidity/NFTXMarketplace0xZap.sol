// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./interface/INFTXFeeDistributor.sol";
import "./interface/INFTXLPStaking.sol";
import "./token/IERC1155Upgradeable.sol";
import "./token/IERC20Upgradeable.sol";
import "./token/ERC721HolderUpgradeable.sol";
import "./token/ERC1155HolderUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";

import "hardhat/console.sol";


/**
 * @notice A partial ERC20 interface.
 */

interface IERC20 {
  function balanceOf(address owner) external view returns (uint256);
  function approve(address spender, uint256 amount) external returns (bool);
  function transfer(address to, uint256 amount) external returns (bool);
}


/**
 * @notice A partial WETH interface.
 */

interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
  function balanceOf(address to) external view returns (uint256);
}


/**
 * @notice Sets up a marketplace zap to interact with the 0x protocol. The 0x contract that
 * is hit later on handles the token conversion based on parameters that are sent from the
 * frontend.
 * 
 * @author Twade
 */

contract NFTXMarketplace0xZap is OwnableUpgradeable, ReentrancyGuardUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {

  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  /// @notice An interface for the WETH contract
  IWETH public immutable WETH;

  /// @notice An interface for the Liquidity Pool staking contract
  INFTXLPStaking public immutable lpStaking;

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable nftxFactory;

  /// @notice A mapping of NFTX Vault IDs to their address corresponding vault contract address
  mapping(uint256 => address) public nftxVaultAddresses;

  /// @notice The decimal accuracy
  uint256 constant BASE = 1e18;

  // Set a constant address for specific contracts that need special logic
  address constant CRYPTO_PUNKS = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
  address constant CRYPTO_KITTIES = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;

  /// @notice Emitted when ..
  /// @param count The number of tokens affected by the event
  /// @param ethSpent The amount of ETH spent in the buy
  /// @param to The user affected by the event
  event Buy(uint256 count, uint256 ethSpent, address to);

  /// @notice Emitted when ..
  /// @param count The number of tokens affected by the event
  /// @param ethReceived The amount of ETH received in the sell
  /// @param to The user affected by the event
  event Sell(uint256 count, uint256 ethReceived, address to);

  /// @notice Emitted when ..
  /// @param count The number of tokens affected by the event
  /// @param ethSpent The amount of ETH spent in the swap
  /// @param to The user affected by the event
  event Swap(uint256 count, uint256 ethSpent, address to);


  /**
   * @notice Initialises our zap by setting contract addresses onto their
   * respective interfaces.
   * 
   * @param _nftxFactory NFTX Vault Factory contract address
   * @param _lpStaking Liquidity Pool Staking contract address
   * @param _WETH WETH contract address
   */

  constructor(address _nftxFactory, address _lpStaking, address _WETH) {
    nftxFactory = INFTXVaultFactory(_nftxFactory);
    lpStaking = INFTXLPStaking(_lpStaking);

    WETH = IWETH(_WETH);
  }


  /**
   * @notice Mints tokens from our NFTX vault and sells them on 0x.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param ids An array of token IDs to be minted
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   * @param to The recipient of the WETH from the tx
   */

  function mintAndSell721(
    uint256 vaultId,
    uint256[] calldata ids,
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to
  ) external nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have been provided IDs
    require(ids.length != 0, 'Must send IDs');

    // Mint our 721s against the vault
    (address vault, ) = _mint721(vaultId, ids);

    // Sell our vault token for WETH
    uint256 amount = _fillQuote(to, vault, WETH, spender, swapTarget, swapCallData);

    // Emit our sale event
    emit Sell(ids.length, amount, to);
  }


  /**
   * @notice Purchases vault tokens from 0x with WETH and then swaps the tokens for
   * either random or specific token IDs from the vault. The specified recipient will
   * receive the ERC721 tokens, as well as any WETH dust that is left over from the tx.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param idsIn An array of random token IDs to be minted
   * @param specificIds An array of any specific token IDs to be minted
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   * @param to The recipient of the WETH from the tx
   * @param weth A boolean representation for if we are dealing with WETH, or ETH
   */

  function buyAndSwap721(
    uint256 vaultId, 
    uint256[] calldata idsIn, 
    uint256[] calldata specificIds, 
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to,
    bool weth
  ) external payable nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have been provided IDs
    require(idsIn.length != 0, 'Must send IDs');

    // Convert our ETH to WETH
    if (!weth) {
      WETH.deposit{value: msg.value}();
    }

    // Get our NFTX vault
    address vault = _vaultAddress(vaultId);

    // Get the redeem fee required for the length of specified IDs. This is provided
    // by the frontend in the swap call data.
    // uint256 redeemFees = (vault.targetSwapFee() * specificIds.length) + (vault.randomSwapFee() * (idsIn.length - specificIds.length));

    // Buy enough vault tokens to fuel our buy
    uint256 amount = _fillQuote(to, vault, WETH, spender, swapTarget, swapCallData);

    // Swap our tokens for the IDs requested
    _swap721(vaultId, idsIn, specificIds, to);
    emit Swap(idsIn.length, amount, to);

    // Return any remaining WETH from the transaction
    uint256 remaining = WETH.balanceOf(address(this));
    if (remaining == 0) {
      return;
    }

    // If we are running a WETH transaction then we can just transfer this
    // back to our recipient.
    if (weth) {
      WETH.transfer(spender, remaining);
    }

    // Otherwise, we will want to convert this WETH to ETH and send to our
    // recipient address.
    else {
      WETH.withdraw(remaining);
      (bool success, ) = payable(to).call{value: remaining}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    }
  }


  /**
   * @notice TODO
   * 
   * @param vaultId The ID of the NFTX vault
   * @param amount The number of tokens to buy
   * @param specificIds An array of any specific token IDs to be minted
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   * @param to The recipient of the WETH from the tx
   * @param weth A boolean representation for if we are dealing with WETH, or ETH
   */

  function buyAndRedeem(
    uint256 vaultId,
    uint256 amount,
    uint256[] calldata specificIds, 
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to,
    bool weth
  ) external payable nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have an amount specified
    require(amount > 0, 'Must send amount');

    if (!weth) {
      WETH.deposit{value: msg.value}();
    }

    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Get the redeem fee required for the length of specified IDs. This is provided
    // by the frontend in the swap call data.
    // (, uint256 randomRedeemFee, uint256 targetRedeemFee, ,) = nftxFactory.vaultFees(vaultId);
    // uint256 totalFee = (targetRedeemFee * specificIds.length) + (randomRedeemFee * (amount - specificIds.length));

    // Buy vault tokens that will cover our transaction
    uint256 quoteAmount = _fillQuote(to, vault, WETH, spender, swapTarget, swapCallData);

    _redeem(vaultId, amount, specificIds, to);
    emit Buy(amount, quoteAmount, to);

    // Refund any remaining WETH
    uint256 remaining = WETH.balanceOf(address(this));
    if (remaining == 0) {
      return;
    }

    if (weth) {
      WETH.transfer(to, remaining);
    }
    else {
      WETH.withdraw(remaining);
      (bool success, ) = payable(to).call{value: remaining}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    }
  }


  /**
   * @notice TODO
   * 
   * @param vaultId TODO
   * @param ids TODO
   */

  function _mint721(
    uint256 vaultId, 
    uint256[] memory ids
  ) internal returns (address, uint256) {
    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Transfer tokens to zap
    address assetAddress = INFTXVault(vault).assetAddress();
    uint256 length = ids.length;

    for (uint256 i; i < length;) {
      transferFromERC721(assetAddress, ids[i], vault);

      if (assetAddress == CRYPTO_PUNKS) {
        approveERC721(assetAddress, ids[i], vault);
      }

      unchecked { ++i; }
    }

    // Mint our tokens
    uint256[] memory emptyIds;
    INFTXVault(vault).mint(ids, emptyIds);

    // Calculate our balance
    uint256 balance = length * (BASE - INFTXVault(vault).mintFee());

    return (vault, balance);
  }


  /**
   * @notice TODO
   * 
   * @param vaultId TODO
   * @param idsIn TODO
   * @param idsOut TODO
   * @param to TODO
   */

  function _swap721(
    uint256 vaultId, 
    uint256[] memory idsIn,
    uint256[] memory idsOut,
    address to
  ) internal returns (address) {
    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Transfer tokens to zap
    address assetAddress = INFTXVault(vault).assetAddress();
    uint256 length = idsIn.length;

    for (uint256 i; i < length;) {
      transferFromERC721(assetAddress, idsIn[i], vault);

      if (assetAddress == CRYPTO_PUNKS) {
        approveERC721(assetAddress, idsIn[i], vault);
      }

      unchecked { ++i; }
    }

    // Swap our tokens
    uint256[] memory emptyIds;
    INFTXVault(vault).swapTo(idsIn, emptyIds, idsOut, to);

    return vault;
  }


  /**
   * @notice TODO
   * 
   * @param vaultId TODO
   * @param amount TODO
   * @param specificIds TODO
   * @param to TODO
   */

  function _redeem(uint256 vaultId, uint256 amount, uint256[] memory specificIds, address to) internal {
    INFTXVault(_vaultAddress(vaultId)).redeemTo(amount, specificIds, to);
  }


  /**
   * @notice TODO
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    bytes memory data;

    if (assetAddr == CRYPTO_KITTIES) {
      data = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, to, tokenId);
    } else if (assetAddr == CRYPTO_PUNKS) {
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
   * @notice TODO
   * 
   * @dev This is only required to provide special logic for Cryptopunks.
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function approveERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    if (assetAddr != CRYPTO_PUNKS) {
      return;
    }

    bytes memory data = abi.encodeWithSignature("offerPunkForSaleToAddress(uint256,uint256,address)", tokenId, 0, to);
    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }


  /**
   * @notice Swaps ERC20->ERC20 tokens held by this contract using a 0x-API quote.
   * 
   * @dev Must attach ETH equal to the `value` field from the API response.
   * 
   * @param vault The address of the vault that will be the `sellTokenAddress` field from the API response
   * @param buyToken The `buyTokenAddress` field from the API response
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   */

  function _fillQuote(
    address payable to,
    address vault,
    IWETH buyToken,
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData
  ) internal returns (uint256) {
      // Track our balance of the buyToken to determine how much we've bought.
      uint256 boughtAmount = buyToken.balanceOf(address(this));

      // Give `spender` an infinite allowance to spend this contract's `sellToken`.
      // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
      // allowance to 0 before being able to update it.
      require(IERC20(vault).approve(spender, type(uint256).max), 'Unable to approve spender');

      // Call the encoded swap function call on the contract at `swapTarget`,
      // passing along any ETH attached to this function call to cover protocol fees.
      (bool success,) = swapTarget.call{value: msg.value}(swapCallData);
      require(success, 'SWAP_CALL_FAILED');

      // Refund any unspent protocol fees to the sender.
      to.transfer(address(this).balance);

      // Use our current buyToken balance to determine how much we've bought.
      return buyToken.balanceOf(address(this)) - boughtAmount;
  }


  /**
   * @notice Maps a cached NFTX vault address against a vault ID.
   * 
   * @param vaultId The ID of the NFTX vault
   */

  function _vaultAddress(uint256 vaultId) internal returns (address) {
    if (nftxVaultAddresses[vaultId] == address(0)) {
      nftxVaultAddresses[vaultId] = nftxFactory.vault(vaultId);
    }

    return nftxVaultAddresses[vaultId];
  }


  /**
   * @notice Allows our owner to withdraw and tokens in the contract.
   * 
   * @param token The address of the token to be rescued
   */

  function rescue(address token) external onlyOwner {
    if (token == address(0)) {
      (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
      require(success, "Address: unable to send value");
    } else {
      IERC20Upgradeable(token).safeTransfer(msg.sender, IERC20Upgradeable(token).balanceOf(address(this)));
    }
  }


  /**
   * @notice Limits our contract to only receive WETH.
   */

  receive() external payable {
    require(msg.sender == address(WETH), "Only WETH");
  }
}
