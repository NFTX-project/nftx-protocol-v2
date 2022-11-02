// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interface/INFTXVault.sol";
import "./interface/INFTXVaultFactory.sol";
import "./token/IERC1155Upgradeable.sol";
import "./token/ERC721HolderUpgradeable.sol";
import "./token/ERC1155HolderUpgradeable.sol";
import "./util/OwnableUpgradeable.sol";
import "./util/ReentrancyGuardUpgradeable.sol";
import "./util/SafeERC20Upgradeable.sol";


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

  /// @notice An interface for the NFTX Vault Factory contract
  INFTXVaultFactory public immutable nftxFactory;

  /// @notice A mapping of NFTX Vault IDs to their address corresponding vault contract address
  mapping(uint256 => address) public nftxVaultAddresses;

  /// @notice The decimal accuracy
  uint256 constant BASE = 1e18;

  // Set a constant address for specific contracts that need special logic
  address constant CRYPTO_PUNKS = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;

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
   * @param _WETH WETH contract address
   */

  constructor(address _nftxFactory, address _WETH) {
    nftxFactory = INFTXVaultFactory(_nftxFactory);
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
    address vault = _mint721(vaultId, ids);

    // Sell our vault token for WETH
    uint256 amount = _fillQuote(vault, address(WETH), swapTarget, swapCallData);

    // Emit our sale event
    emit Sell(ids.length, amount, to);

    // Transfer the filled ETH to recipient
    _transferEthDust(to, amount);
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
   */

  function buyAndSwap721(
    uint256 vaultId, 
    uint256[] calldata idsIn, 
    uint256[] calldata specificIds, 
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to
  ) external payable nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have been provided IDs
    require(idsIn.length != 0, 'Must send IDs');

    // Check that we have a message value sent
    require(msg.value > 0, 'Invalid amount');

    // Wrap ETH into WETH for our contract from the sender
    WETH.deposit{value: msg.value}();

    // Get our NFTX vault
    address vault = _vaultAddress(vaultId);

    // Buy enough vault tokens to fuel our buy
    uint256 amount = _fillQuote(address(WETH), vault, swapTarget, swapCallData);

    // Swap our tokens for the IDs requested
    _swap721(vaultId, idsIn, specificIds, to);
    emit Swap(idsIn.length, amount, to);

    // Return any remaining WETH from the transaction
    uint256 remaining = WETH.balanceOf(address(this));
    if (remaining > 0) {
      _transferEthDust(spender, remaining);
    }

    // Return any remaining vault token dust that may remain due to slippage
    _transferVaultDust(spender, vault);
  }


  /**
   * @notice Purchases vault tokens from 0x with WETH and then redeems the tokens for
   * either random or specific token IDs from the vault. The specified recipient will
   * receive the ERC721 tokens, as well as any WETH dust that is left over from the tx.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param amount The number of tokens to buy
   * @param specificIds An array of any specific token IDs to be minted
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   * @param to The recipient of the WETH from the tx
   */

  function buyAndRedeem(
    uint256 vaultId,
    uint256 amount,
    uint256[] calldata specificIds, 
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to
  ) external payable nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have an amount specified
    require(amount > 0, 'Must send amount');

    // Check that we have a message value sent
    require(msg.value >= amount, 'Invalid amount');

    // Wrap ETH into WETH for our contract from the sender
    WETH.deposit{value: msg.value}();

    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Buy vault tokens that will cover our transaction
    uint256 quoteAmount = _fillQuote(address(WETH), vault, swapTarget, swapCallData);

    // Redeem token IDs from the vault
    _redeem(vaultId, amount, specificIds, to);
    emit Buy(amount, quoteAmount, to);

    // Refund any remaining WETH
    uint256 remaining = WETH.balanceOf(address(this));
    if (remaining > 0) {
      _transferEthDust(spender, remaining);
    }

    // Return any remaining vault token dust that may remain due to slippage
    _transferVaultDust(spender, vault);
  }


  /**
   * @notice Mints tokens from our NFTX vault and sells them on 0x.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param ids An array of token IDs to be minted
   * @param amounts The number of the corresponding ID to be minted
   * @param spender The `allowanceTarget` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   * @param to The recipient of the WETH from the tx
   */

  function mintAndSell1155(
    uint256 vaultId,
    uint256[] calldata ids,
    uint256[] calldata amounts,
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to
  ) external nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Get a sum of the total number of IDs we have sent up, and validate that
    // the data sent through is valid.
    (, uint totalAmount) = _validate1155Ids(ids, amounts);

    // Mint our 1155s against the vault
    address vault = _mint1155(vaultId, ids, amounts);

    // Sell our vault token for WETH
    uint256 amount = _fillQuote(vault, address(WETH), swapTarget, swapCallData);

    // Emit our sale event
    emit Sell(totalAmount, amount, to);

    // Transfer the filled ETH to recipient
    _transferEthDust(to, amount);
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
   */

  function buyAndSwap1155(
    uint256 vaultId, 
    uint256[] calldata idsIn,
    uint256[] calldata amounts,
    uint256[] calldata specificIds,
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to
  ) external payable nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this), 'Invalid recipient');

    // Check that we have a message value sent
    require(msg.value > 0, 'Invalid amount');

    // Get a sum of the total number of IDs we have sent up, and validate that
    // the data sent through is valid.
    (, uint totalAmount) = _validate1155Ids(idsIn, amounts);

    // Wrap ETH into WETH for our contract from the sender
    WETH.deposit{value: msg.value}();

    // Get our NFTX vault
    address vault = _vaultAddress(vaultId);

    // Buy enough vault tokens to fuel our buy
    uint256 amount = _fillQuote(address(WETH), vault, swapTarget, swapCallData);

    // Swap our tokens for the IDs requested
    _swap1155(vaultId, idsIn, amounts, specificIds, to);
    emit Swap(totalAmount, amount, to);

    // Return any remaining WETH from the transaction
    uint256 remaining = WETH.balanceOf(address(this));
    if (remaining > 0) {
      _transferEthDust(spender, remaining);
    }

    // Return any remaining vault token dust that may remain due to slippage
    _transferVaultDust(spender, vault);
  }


  /**
   * @param vaultId The ID of the NFTX vault
   * @param ids An array of token IDs to be minted
   */

  function _mint721(uint256 vaultId, uint256[] memory ids) internal returns (address) {
    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Transfer tokens from the message sender to the vault
    address assetAddress = INFTXVault(vault).assetAddress();
    uint256 length = ids.length;

    for (uint256 i; i < length;) {
      transferFromERC721(assetAddress, ids[i], vault);

      if (assetAddress == CRYPTO_PUNKS) {
        _approveERC721(assetAddress, ids[i], vault);
      }

      unchecked { ++i; }
    }

    // Mint our tokens from the vault to this contract
    uint256[] memory emptyIds;
    INFTXVault(vault).mint(ids, emptyIds);

    return vault;
  }


  /**
   * @param vaultId The ID of the NFTX vault
   * @param ids An array of token IDs to be minted
   * @param amounts An array of amounts whose indexes map to the ids array
   */

  function _mint1155(uint256 vaultId, uint256[] memory ids, uint256[] memory amounts) internal returns (address) {
    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Transfer tokens from the message sender to the vault
    address assetAddress = INFTXVault(vault).assetAddress();
    IERC1155Upgradeable(assetAddress).safeBatchTransferFrom(msg.sender, address(this), ids, amounts, "");
    IERC1155Upgradeable(assetAddress).setApprovalForAll(vault, true);

    // Mint our tokens from the vault to this contract
    INFTXVault(vault).mint(ids, amounts);

    return vault;
  }


  /**
   * 
   * @param vaultId The ID of the NFTX vault
   * @param idsIn An array of token IDs to be minted
   * @param idsOut An array of token IDs to be redeemed
   * @param to The recipient of the idsOut from the tx
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
        _approveERC721(assetAddress, idsIn[i], vault);
      }

      unchecked { ++i; }
    }

    // Swap our tokens
    uint256[] memory emptyIds;
    INFTXVault(vault).swapTo(idsIn, emptyIds, idsOut, to);

    return vault;
  }


  /**
   * @notice Swaps 1155 tokens, transferring them from the recipient to this contract, and
   * then sending them to the NFTX vault, that sends them to the recipient.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param idsIn The IDs owned by the sender to be swapped
   * @param amounts The number of each corresponding ID being swapped
   * @param idsOut The requested IDs to be swapped for
   * @param to The recipient of the swapped tokens
   * 
   * @return address The address of the NFTX vault
   */

  function _swap1155(
    uint256 vaultId, 
    uint256[] memory idsIn,
    uint256[] memory amounts,
    uint256[] memory idsOut,
    address to
  ) internal returns (address) {
    // Get our vault address information
    address vault = _vaultAddress(vaultId);

    // Transfer tokens to zap and mint to NFTX.
    address assetAddress = INFTXVault(vault).assetAddress();
    IERC1155Upgradeable(assetAddress).safeBatchTransferFrom(msg.sender, address(this), idsIn, amounts, "");
    IERC1155Upgradeable(assetAddress).setApprovalForAll(vault, true);
    INFTXVault(vault).swapTo(idsIn, amounts, idsOut, to);
    
    return vault;
  }


  /**
   * @notice Redeems tokens from a vault to a recipient.
   * 
   * @param vaultId The ID of the NFTX vault
   * @param amount The number of tokens to be redeemed
   * @param specificIds Specified token IDs if desired, otherwise will be _random_
   * @param to The recipient of the token
   */

  function _redeem(uint256 vaultId, uint256 amount, uint256[] memory specificIds, address to) internal {
    INFTXVault(_vaultAddress(vaultId)).redeemTo(amount, specificIds, to);
  }


  /**
   * @notice Transfers our ERC721 tokens to a specified recipient.
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    bytes memory data;

    if (assetAddr == CRYPTO_PUNKS) {
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
   * @notice Approves our ERC721 tokens to be transferred.
   * 
   * @dev This is only required to provide special logic for Cryptopunks.
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function _approveERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
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
   * @param sellToken The `sellTokenAddress` field from the API response
   * @param buyToken The `buyTokenAddress` field from the API response
   * @param swapTarget The `to` field from the API response
   * @param swapCallData The `data` field from the API response
   */

  function _fillQuote(
    address sellToken,
    address buyToken,
    address payable swapTarget,
    bytes calldata swapCallData
  ) internal returns (uint256) {
      // Track our balance of the buyToken to determine how much we've bought.
      uint256 boughtAmount = IERC20(buyToken).balanceOf(address(this));

      // Give `swapTarget` an infinite allowance to spend this contract's `sellToken`.
      // Note that for some tokens (e.g., USDT, KNC), you must first reset any existing
      // allowance to 0 before being able to update it.
      require(IERC20(sellToken).approve(swapTarget, type(uint256).max), 'Unable to approve contract');

      // Call the encoded swap function call on the contract at `swapTarget`
      (bool success,) = swapTarget.call(swapCallData);
      require(success, 'SWAP_CALL_FAILED');

      // Use our current buyToken balance to determine how much we've bought.
      return IERC20(buyToken).balanceOf(address(this)) - boughtAmount;
  }


  /**
   * @notice Transfers ETH or WETH to a recipient, based on preference.
   * 
   * @param to Recipient of the transfer
   * @param amount Amount to be transferred
   */

  function _transferEthDust(address to, uint amount) internal {
    // Unwrap our WETH into ETH and transfer it to the recipient
    WETH.withdraw(amount);
    (bool success, ) = payable(to).call{value: amount}("");
    require(success, "Unable to send unwrapped WETH");
  }


  /**
   * @notice Transfers any vault token dust remaining on the contract to the spender.
   * 
   * @param to Recipient of the transfer
   * @param vault Address of the vault token
   */

  function _transferVaultDust(address to, address vault) internal {
    uint dustBalance = IERC20Upgradeable(vault).balanceOf(address(this));
    if (dustBalance > 0) {
      IERC20Upgradeable(vault).transfer(to, dustBalance);
    }
  }


  /**
   * @notice Allows 1155 IDs and amounts to be validated.
   * 
   * @param ids The IDs of the 1155 tokens.
   * @param amounts The number of each corresponding token to process.
   * 
   * @return totalIds The number of different IDs being sent.
   * @return totalAmount The total number of IDs being processed.
   */

  function _validate1155Ids(
    uint[] calldata ids,
    uint[] calldata amounts
  ) internal pure returns (
    uint totalIds,
    uint totalAmount
  ) {
    totalIds = ids.length;

    // Check that we have been provided IDs
    require(totalIds != 0, 'Must send IDs');
    require(totalIds <= amounts.length, 'Must define amounts against IDs');

    // Sum the amounts for our emitted events
    for (uint i; i < totalIds;) {
      require(amounts[i] > 0, 'Invalid 1155 amount');

      unchecked {
        totalAmount += amounts[i];
        ++i;
      }
    }
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

    require(nftxVaultAddresses[vaultId] != address(0), 'Vault does not exist');

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
   * @notice Allows our contract to receive any assets.
   */

  receive() external payable {
    //
  }

}
