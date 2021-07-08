pragma solidity ^0.8.0;

import "./util/OwnableUpgradeable.sol"; 

contract NFTXMigrationV2 is OwnableUpgradeable { 

  mapping(address => address) public migrationToken;

  function addMigrationPair(address v1Addr, address v2Addr) external onlyOwner {

  }
}