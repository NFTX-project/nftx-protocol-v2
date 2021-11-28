// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface INFTXInventoryStaking {
    function lockTime() external view returns (uint256);
    function nftxVaultFactory() external view returns (address);
    function vaultXToken(uint256 vaultId) external view returns (address);

    event XTokenCreated(uint256 vaultId, address baseToken, address xToken);

    function __NFTXInventoryStaking__init() external;
    
    function setNFTXVaultFactory(address newFactory) external;
    function deployXTokenForVault(uint256 vaultId) external;
    function receiveRewards(uint256 vaultId, uint256 amount) external;
    function zapDeposit721(uint256 vaultId, uint256[] memory ids) external;
    function zapDeposit1155(uint256 vaultId, uint256[] memory ids, uint256[] memory amounts) external;
    function deposit(uint256 vaultId, uint256 _amount) external;
    function withdraw(uint256 vaultId, uint256 _share) external;
}