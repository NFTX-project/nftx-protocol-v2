pragma solidity ^0.8.0;

import "../token/ERC721Enumerable.sol";
import "../token/IERC20Upgradeable.sol";
import "../interface/INFTXVault.sol";
import "../interface/INFTXVaultFactory.sol";
import "hardhat/console.sol";

contract NFTMintDistro is ERC721Enumerable {
  address nftxVault; 
  INFTXVaultFactory public nftxFactory = INFTXVaultFactory(0xBE86f647b167567525cCAAfcd6f881F1Ee558216);
  mapping(uint256 => bool) minted;
  uint256 public totalMinted;
  uint256 public amountToLP;

  uint256 constant BASE = 10**18;

  mapping(address => uint256) public reservedMints;

  constructor() ERC721("TEST", "TEST") {

  }

  /**
    * @dev See {IERC721-safeTransferFrom}.
    */
  function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory _data) public virtual override {
    // Only handle special if the sender is not the vault.
    if (msg.sender != address(nftxVault)) {
      super.safeTransferFrom(from, to, tokenId, _data);
    } else {
      bool isMinted = minted[tokenId];
      if (totalMinted > 6000) {
          // Enable minting in the vault so it can slowly become a floor pool, maybe.
      } 
      if (!isMinted && from == address(this)) {
        // This is a fake mint, do nothing in order to trick NFTX into thinking it has the NFT, when it doesn't.
        console.log("Fake deposit: ", tokenId);
        return;
      } else if (!isMinted && from == address(nftxVault)) {
        // If the token is not minted, and its a transfer from the vault, it means someone is withdrawing.
        // This is if the token has not been minted yet, we mint the token to whoever is redeeming from the vault.
        _safeMint(to, tokenId);
      } else {
        // Should never occur, revert just in case.
        revert("invalid");
      }
    }
  }

  function createVault() public {
    uint256 vaultId = nftxFactory.createVault(
      "TEST",
      "TESTTT",
      address(this),
      false,
      true
    );
    nftxVault = nftxFactory.vault(vaultId);
    INFTXVault(nftxVault).setFees(0, 0, 0);
    INFTXVault(nftxVault).setVaultFeatures(false, false, true);
  }

  function insertIds(uint256 count) public {
    INFTXVault(nftxVault).preMint(count);
  }

  function finalizeVault() public {
    INFTXVault(nftxVault).setFees(5 ether, 0, 5 ether);
    INFTXVault(nftxVault).setVaultFeatures(true, true, true);
    INFTXVault(nftxVault).finalizeVault();
  }

  function reserve(uint256 count) public {
    // Accept eth, and check supply, etc.
    // block lock
    reservedMints[msg.sender] += count;
  }

  function mint(uint256 count) public {
    reservedMints[msg.sender] -= count;
    uint256[] memory ids = new uint256[](count);
    uint256 currentSupply = totalSupply();
    for (uint256 i = 0; i < count; i++) {
      ids[i] = currentSupply + i;
    }
    INFTXVault(nftxVault).redeem(count, ids);
  }
}