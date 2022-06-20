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


// Authors: @tomwade

// A partial ERC20 interface.
interface IERC20 {
    function balanceOf(address owner) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

// A partial WETH interface.
interface IWETH {
  function deposit() external payable;
  function transfer(address to, uint value) external returns (bool);
  function withdraw(uint) external;
  function balanceOf(address to) external view returns (uint256);
}


contract NFTXMarketplaceZap is OwnableUpgradeable, ReentrancyGuardUpgradeable, ERC721HolderUpgradeable, ERC1155HolderUpgradeable {
  using SafeERC20Upgradeable for IERC20Upgradeable;
  
  IWETH public immutable WETH;
  INFTXLPStaking public immutable lpStaking;
  INFTXVaultFactory public immutable nftxFactory;

  mapping(uint256 => address) public nftxVaultAddresses;

  uint256 constant BASE = 1e18;

  event Buy(uint256 count, uint256 ethSpent, address to);
  event Sell(uint256 count, uint256 ethReceived, address to);
  event Swap(uint256 count, uint256 ethSpent, address to);

  constructor(address _nftxFactory, address _WETH) {
    nftxFactory = INFTXVaultFactory(_nftxFactory);
    lpStaking = INFTXLPStaking(INFTXFeeDistributor(INFTXVaultFactory(_nftxFactory).feeDistributor()).lpStaking());

    WETH = IWETH(_WETH);
  }

  function mintAndSell721(
    uint256 vaultId, 
    uint256[] calldata ids, 
    address spender,
    address payable swapTarget,
    bytes calldata swapCallData,
    address payable to,
    bool weth
  ) external nonReentrant {
    // Check that we aren't burning tokens or sending to ourselves
    require(to != address(0) && to != address(this));

    // Check that we have been provided IDs
    require(ids.length != 0);

    // Mint our 721s against the vault
    (address vault, uint256 vaultBalance) = _mint721(vaultId, ids);

    // Sell our vault token for WETH
    uint256 amount = _fillQuote(to, vault, WETH, spender, swapTarget, swapCallData);

    // Emit our sale event
    emit Sell(ids.length, amount, to);
  }

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
    require(to != address(0) && to != address(this));

    // Check that we have been provided IDs
    require(idsIn.length != 0);

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

    if (weth) {
      WETH.transfer(to, remaining);
    }
    else {
      WETH.withdraw(remaining);
      (bool success, ) = payable(to).call{value: remaining}("");
      require(success, "Address: unable to send value, recipient may have reverted");
    }
  }

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
    require(to != address(0) && to != address(this));

    // Check that we have an amount specified
    require(amount != 0);

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
      approveERC721(assetAddress, ids[i], vault);

      unchecked { ++i; }
    }

    // Mint our tokens
    uint256[] memory emptyIds;
    INFTXVault(vault).mint(ids, emptyIds);

    // Calculate our balance
    uint256 balance = (length * BASE) - (length * INFTXVault(vault).mintFee()); 
    
    return (vault, balance);
  }

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
      approveERC721(assetAddress, idsIn[i], vault);

      unchecked { ++i; }
    }

    // Swap our tokens
    uint256[] memory emptyIds;
    INFTXVault(vault).swapTo(idsIn, emptyIds, idsOut, to);

    return vault;
  }

  function _redeem(
    uint256 vaultId, 
    uint256 amount,
    uint256[] memory specificIds,
    address to
  ) internal {
    INFTXVault(_vaultAddress(vaultId)).redeemTo(amount, specificIds, to);
  }


  /**
   * @notice ..
   * 
   * @dev ..
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function transferFromERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    address kitties = 0x06012c8cf97BEaD5deAe237070F9587f8E7A266d;
    address punks = 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB;
    bytes memory data;
    if (assetAddr == kitties) {
        // Cryptokitties.
        data = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, to, tokenId);
    } else if (assetAddr == punks) {
        // CryptoPunks.
        // Fix here for frontrun attack. Added in v1.0.2.
        bytes memory punkIndexToAddress = abi.encodeWithSignature("punkIndexToAddress(uint256)", tokenId);
        (bool checkSuccess, bytes memory result) = address(assetAddr).staticcall(punkIndexToAddress);
        (address nftOwner) = abi.decode(result, (address));
        require(checkSuccess && nftOwner == msg.sender, "Not the NFT owner");
        data = abi.encodeWithSignature("buyPunk(uint256)", tokenId);
    } else {
        // Default.
        // We push to the vault to avoid an unneeded transfer.
        data = abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", msg.sender, to, tokenId);
    }
    (bool success, bytes memory resultData) = address(assetAddr).call(data);
    require(success, string(resultData));
  }


  /**
   * @notice ..
   * 
   * @dev ..
   * 
   * @param assetAddr Address of the asset being transferred
   * @param tokenId The ID of the token being transferred
   * @param to The address the token is being transferred to
   */

  function approveERC721(address assetAddr, uint256 tokenId, address to) internal virtual {
    if (assetAddr != 0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB) {
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
      require(IERC20(vault).approve(spender, type(uint256).max));

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
      require(success, "Address: unable to send value, recipient may have reverted");
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
