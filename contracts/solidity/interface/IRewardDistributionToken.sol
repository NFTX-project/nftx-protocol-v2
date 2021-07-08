// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IRewardDistributionToken {
  function distributeRewards(uint amount) external;
}