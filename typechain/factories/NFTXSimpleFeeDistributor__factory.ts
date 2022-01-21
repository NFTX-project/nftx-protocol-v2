/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  NFTXSimpleFeeDistributor,
  NFTXSimpleFeeDistributorInterface,
} from "../NFTXSimpleFeeDistributor";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "allocPoint",
        type: "uint256",
      },
    ],
    name: "AddFeeReceiver",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "paused",
        type: "bool",
      },
    ],
    name: "PauseDistribution",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "RemoveFeeReceiver",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isGuardian",
        type: "bool",
      },
    ],
    name: "SetIsGuardian",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "lockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "paused",
        type: "bool",
      },
    ],
    name: "SetPaused",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "oldReceiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newReceiver",
        type: "address",
      },
    ],
    name: "UpdateFeeReceiverAddress",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "allocPoint",
        type: "uint256",
      },
    ],
    name: "UpdateFeeReceiverAlloc",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newInventoryStaking",
        type: "address",
      },
    ],
    name: "UpdateInventoryStakingAddress",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newLPStaking",
        type: "address",
      },
    ],
    name: "UpdateLPStakingAddress",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "UpdateNFTXVaultFactory",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "newTreasury",
        type: "address",
      },
    ],
    name: "UpdateTreasuryAddress",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_lpStaking",
        type: "address",
      },
      {
        internalType: "address",
        name: "_treasury",
        type: "address",
      },
    ],
    name: "__SimpleFeeDistributor__init__",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_allocPoint",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_receiver",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isContract",
        type: "bool",
      },
    ],
    name: "addReceiver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "allocTotal",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_receiverIdx",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isContract",
        type: "bool",
      },
    ],
    name: "changeReceiverAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_receiverIdx",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_allocPoint",
        type: "uint256",
      },
    ],
    name: "changeReceiverAlloc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "vaultId",
        type: "uint256",
      },
    ],
    name: "distribute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "distributionPaused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "feeReceivers",
    outputs: [
      {
        internalType: "uint256",
        name: "allocPoint",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
      {
        internalType: "bool",
        name: "isContract",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_vaultId",
        type: "uint256",
      },
    ],
    name: "initializeVaultReceivers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "inventoryStaking",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isGuardian",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "isPaused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "lpStaking",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nftxVaultFactory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lockId",
        type: "uint256",
      },
    ],
    name: "onlyOwnerIfPaused",
    outputs: [],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lockId",
        type: "uint256",
      },
    ],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_pause",
        type: "bool",
      },
    ],
    name: "pauseFeeDistribution",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_receiverIdx",
        type: "uint256",
      },
    ],
    name: "removeReceiver",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "rescueTokens",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_inventoryStaking",
        type: "address",
      },
    ],
    name: "setInventoryStakingAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "addr",
        type: "address",
      },
      {
        internalType: "bool",
        name: "_isGuardian",
        type: "bool",
      },
    ],
    name: "setIsGuardian",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_lpStaking",
        type: "address",
      },
    ],
    name: "setLPStakingAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_factory",
        type: "address",
      },
    ],
    name: "setNFTXVaultFactory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_treasury",
        type: "address",
      },
    ],
    name: "setTreasuryAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasury",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lockId",
        type: "uint256",
      },
    ],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506126db806100206000396000f3fe608060405234801561001057600080fd5b50600436106101ce5760003560e01c806374a1b0b011610104578063a534cbbd116100a2578063bdf2a43c11610071578063bdf2a43c14610408578063d46307dc1461042b578063f2fde38b1461043e578063fabc1cbc1461045157600080fd5b8063a534cbbd146103bc578063a77abced146103cf578063aa463065146103e2578063af056847146103f557600080fd5b80638da5cb5b116100de5780638da5cb5b14610372578063915c5baf1461038357806391c05b0b146103965780639bf1401c146103a957600080fd5b806374a1b0b0146103395780637c77b6161461034c5780638c0fd23d1461035f57600080fd5b806336d4d031116101715780635b3817601161014b5780635b381760146102d357806361d027b31461030b5780636605bfda1461031e578063715018a61461033157600080fd5b806336d4d031146102835780633801daf1146102965780634912300d146102c657600080fd5b80630c68ba21116101ad5780630c68ba2114610217578063136439dd1461024a57806319d3d2a41461025d57806323845fb51461027057600080fd5b8062ae3bf8146101d357806303220d02146101e857806308131951146101fb575b600080fd5b6101e66101e13660046123dd565b610464565b005b6101e66101f63660046124e2565b610545565b610204609c5481565b6040519081526020015b60405180910390f35b61023a6102253660046123dd565b60976020526000908152604090205460ff1681565b604051901515815260200161020e565b6101e66102583660046124b2565b610641565b6101e661026b3660046124b2565b6106f8565b6101e661027e36600461244d565b61085c565b6101e66102913660046123dd565b610907565b6099546102ae9061010090046001600160a01b031681565b6040516001600160a01b03909116815260200161020e565b60995461023a9060ff1681565b6102e66102e13660046124b2565b6109f3565b604080519384526001600160a01b03909216602084015215159082015260600161020e565b609b546102ae906001600160a01b031681565b6101e661032c3660046123dd565b610a36565b6101e6610b22565b609e546102ae906001600160a01b031681565b6101e661035a3660046124b2565b610bb4565b6101e661036d36600461247a565b610c28565b6065546001600160a01b03166102ae565b6101e6610391366004612415565b610cb1565b6101e66103a43660046124b2565b610da1565b609a546102ae906001600160a01b031681565b6101e66103ca3660046123dd565b61121c565b6101e66103dd3660046123dd565b6112b2565b6101e66103f0366004612523565b6113c5565b6101e66104033660046124b2565b611516565b61023a6104163660046124b2565b60986020526000908152604090205460ff1681565b6101e66104393660046124e2565b61178e565b6101e661044c3660046123dd565b6117e1565b6101e661045f3660046124b2565b611901565b6065546001600160a01b031633146104b15760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064015b60405180910390fd5b6040516370a0823160e01b81523060048201526000906001600160a01b038316906370a082319060240160206040518083038186803b1580156104f357600080fd5b505afa158015610507573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061052b91906124ca565b90506105416001600160a01b0383163383611996565b5050565b6065546001600160a01b0316331461058d5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6000609d84815481106105b057634e487b7160e01b600052603260045260246000fd5b60009182526020918290206002909102016001810180546001600160a01b0387811674ffffffffffffffffffffffffffffffffffffffffff1983168117600160a01b89151502179093556040805191909216808252948101929092529193507f466bf064fd123a99d87cf265d40a3335a650757a2a5ece87ce6f888419f56d32910160405180910390a15050505050565b3360009081526097602052604090205460ff166106a05760405162461bcd60e51b815260206004820152600b60248201527f43616e277420706175736500000000000000000000000000000000000000000060448201526064016104a8565b600081815260986020908152604091829020805460ff191660019081179091558251848152918201527f77f1fcfcce67dc392d64f842056d2ec06c80986c47c910f7e79c5b23a2738d7491015b60405180910390a150565b60995461010090046001600160a01b031633146107575760405162461bcd60e51b815260206004820152601860248201527f46656552656365697665723a206e6f7420666163746f7279000000000000000060448201526064016104a8565b609a546040517f87a6753f000000000000000000000000000000000000000000000000000000008152600481018390526001600160a01b03909116906387a6753f90602401600060405180830381600087803b1580156107b657600080fd5b505af11580156107ca573d6000803e3d6000fd5b5050609e546001600160a01b0316159150610859905057609e546040517ff0f2a4d7000000000000000000000000000000000000000000000000000000008152600481018390526001600160a01b039091169063f0f2a4d790602401600060405180830381600087803b15801561084057600080fd5b505af1158015610854573d6000803e3d6000fd5b505050505b50565b6065546001600160a01b031633146108a45760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6001600160a01b038216600081815260976020908152604091829020805460ff19168515159081179091558251938452908301527fd0b6b573d5442f7c29fd50d9735ae341581c25c6ed07748d50eda519f1ffa88a910160405180910390a15050565b6065546001600160a01b0316331461094f5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6001600160a01b0381166109a55760405162461bcd60e51b815260206004820152601760248201527f4c505374616b696e6720213d206164647265737328302900000000000000000060448201526064016104a8565b609a80546001600160a01b0319166001600160a01b0383169081179091556040519081527f4de1363210f44b38c4e5a2ccac49005c6fc0041f1ead7de1bbc6fd23735a4fdc906020016106ed565b609d8181548110610a0357600080fd5b6000918252602090912060029091020180546001909101549091506001600160a01b03811690600160a01b900460ff1683565b6065546001600160a01b03163314610a7e5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6001600160a01b038116610ad45760405162461bcd60e51b815260206004820152601660248201527f547265617375727920213d20616464726573732830290000000000000000000060448201526064016104a8565b609b80546001600160a01b0319166001600160a01b0383169081179091556040519081527f30d36c1dd67e2019526263df539f65050c3b537a6acf65766b5da7de7128cf36906020016106ed565b6065546001600160a01b03163314610b6a5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6065546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a3606580546001600160a01b0319169055565b60008181526098602052604090205460ff161580610bdc57506065546001600160a01b031633145b6108595760405162461bcd60e51b815260206004820152600660248201527f506175736564000000000000000000000000000000000000000000000000000060448201526064016104a8565b6065546001600160a01b03163314610c705760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6099805460ff19168215159081179091556040519081527fb008f183388020de01fd4365e295aa904b691f98e63fd033f74f75273b6b285f906020016106ed565b600054610100900460ff1680610cca575060005460ff16155b610d2d5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104a8565b600054610100900460ff16158015610d4f576000805461ffff19166101011790555b610d57611a3f565b610d6082610a36565b610d6983610907565b609a54610d8a90670b1a2bc2ec500000906001600160a01b03166001611af9565b8015610d9c576000805461ff00191690555b505050565b60026001541415610df45760405162461bcd60e51b815260206004820152601f60248201527f5265656e7472616e637947756172643a207265656e7472616e742063616c6c0060448201526064016104a8565b600260015560995461010090046001600160a01b0316610e1357600080fd5b6099546040517f81a36fb60000000000000000000000000000000000000000000000000000000081526004810183905260009161010090046001600160a01b0316906381a36fb69060240160206040518083038186803b158015610e7657600080fd5b505afa158015610e8a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610eae91906123f9565b6040516370a0823160e01b81523060048201529091506000906001600160a01b038316906370a082319060240160206040518083038186803b158015610ef357600080fd5b505afa158015610f07573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610f2b91906124ca565b60995490915060ff1680610f3f5750609c54155b15610f6557609b54610f5e906001600160a01b03848116911683611996565b5050611215565b609d546000805b82811015611170576000609d8281548110610f9757634e487b7160e01b600052603260045260246000fd5b600091825260208083206040805160608101825260029490940290910180548085526001909101546001600160a01b03811693850193909352600160a01b90920460ff16151590830152609c54919350610ff190886125cb565b610ffb91906125ab565b6110059085612593565b6040516370a0823160e01b81523060048201529091506000906001600160a01b038916906370a082319060240160206040518083038186803b15801561104a57600080fd5b505afa15801561105e573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061108291906124ca565b90508082116110915781611093565b805b915060006110a3848b8b86611c17565b905080611156576020840151604051636eb1769f60e11b81523060048201526001600160a01b0391821660248201526000918b169063dd62ed3e9060440160206040518083038186803b1580156110f957600080fd5b505afa15801561110d573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061113191906124ca565b602086015190915061114f906001600160a01b038c16906000611dcf565b955061115b565b600095505b505050508061116990612631565b9050610f6c565b508015611210576040516370a0823160e01b81523060048201526000906001600160a01b038616906370a082319060240160206040518083038186803b1580156111b957600080fd5b505afa1580156111cd573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906111f191906124ca565b609b5490915061120e906001600160a01b03878116911683611996565b505b505050505b5060018055565b6065546001600160a01b031633146112645760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b609e80546001600160a01b0319166001600160a01b0383169081179091556040519081527f6e74da1326dcd8931bd9213a2f7ecf361c7008ccad60543e78b5cd50ca6e556a906020016106ed565b6065546001600160a01b031633146112fa5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b60995461010090046001600160a01b0316156113585760405162461bcd60e51b815260206004820152601d60248201527f6e6674785661756c74466163746f727920697320696d6d757461626c6500000060448201526064016104a8565b609980547fffffffffffffffffffffff0000000000000000000000000000000000000000ff166101006001600160a01b038416908102919091179091556040519081527f2693263e4020b2649b9bcc9a4b68c471d4ac35c81baa35264c695d647822b1a2906020016106ed565b6065546001600160a01b0316331461140d5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b609d54821061145e5760405162461bcd60e51b815260206004820152601d60248201527f4665654469737472696275746f723a204f7574206f6620626f756e647300000060448201526064016104a8565b6000609d838154811061148157634e487b7160e01b600052603260045260246000fd5b906000526020600020906002020190508060000154609c60008282546114a791906125ea565b9091555050818155609c80548391906000906114c4908490612593565b90915550506001810154604080516001600160a01b039092168252602082018490527fbf9a378b372297e179e435cdca3b5215960b36e3489288832cbdc7f323ff987d910160405180910390a1505050565b6065546001600160a01b0316331461155e5760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b609d548082106115b05760405162461bcd60e51b815260206004820152601d60248201527f4665654469737472696275746f723a204f7574206f6620626f756e647300000060448201526064016104a8565b7fef79c7490a6b7ae3d254565a3bdf2a58d73afe9877306e1c74121209a5527021609d83815481106115f257634e487b7160e01b600052603260045260246000fd5b6000918252602091829020600290910201600101546040516001600160a01b0390911681520160405180910390a1609d828154811061164157634e487b7160e01b600052603260045260246000fd5b906000526020600020906002020160000154609c600082825461166491906125ea565b90915550609d90506116776001836125ea565b8154811061169557634e487b7160e01b600052603260045260246000fd5b9060005260206000209060020201609d83815481106116c457634e487b7160e01b600052603260045260246000fd5b600091825260209091208254600290920201908155600191820180549290910180546001600160a01b031981166001600160a01b039094169384178255915460ff600160a01b918290041615150274ffffffffffffffffffffffffffffffffffffffffff19909216909217179055609d80548061175157634e487b7160e01b600052603160045260246000fd5b600082815260208120600260001990930192830201908155600101805474ffffffffffffffffffffffffffffffffffffffffff1916905590555050565b6065546001600160a01b031633146117d65760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b610d9c838383611af9565b6065546001600160a01b031633146118295760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6001600160a01b0381166118a55760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f646472657373000000000000000000000000000000000000000000000000000060648201526084016104a8565b6065546040516001600160a01b038084169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a3606580546001600160a01b0319166001600160a01b0392909216919091179055565b6065546001600160a01b031633146119495760405162461bcd60e51b8152602060048201819052602482015260008051602061268683398151915260448201526064016104a8565b6000818152609860209081526040808320805460ff191690558051848152918201929092527f77f1fcfcce67dc392d64f842056d2ec06c80986c47c910f7e79c5b23a2738d7491016106ed565b6040516001600160a01b038316602482015260448101829052610d9c9084907fa9059cbb00000000000000000000000000000000000000000000000000000000906064015b60408051601f198184030181529190526020810180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167fffffffff0000000000000000000000000000000000000000000000000000000090931692909217909152611f13565b600054610100900460ff1680611a58575060005460ff16155b611abb5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104a8565b600054610100900460ff16158015611add576000805461ffff19166101011790555b611ae5611ff8565b8015610859576000805461ff001916905550565b604080516060810182528481526001600160a01b0384811660208301908152841515938301938452609d8054600181018255600091825284517fd26e832454299e9fabb89e0e5fffdc046d4e14431bc1bf607ffb2e8a1ddecf7b60029092029182015591517fd26e832454299e9fabb89e0e5fffdc046d4e14431bc1bf607ffb2e8a1ddecf7c909201805495519290931674ffffffffffffffffffffffffffffffffffffffffff1990951694909417600160a01b91151591909102179055609c805491928692611bca908490612593565b9091555050604080516001600160a01b0385168152602081018690527f555ceefe9e17f4ae5f15e17c385a8eb55c46bddb25897aeabadcda1815dd5a75910160405180910390a150505050565b6000846040015115611da9576020850151611c3d906001600160a01b0385169084611dcf565b604080516024810186905260448082018590528251808303909101815260649091018252602080820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff167ff36d52da00000000000000000000000000000000000000000000000000000000179052870151915190916000916001600160a01b0390911690611ccb908490612544565b6000604051808303816000865af19150503d8060008114611d08576040519150601f19603f3d011682016040523d82523d6000602084013e611d0d565b606091505b50509050808015611da057506020870151604051636eb1769f60e11b81523060048201526001600160a01b0391821660248201529086169063dd62ed3e9060440160206040518083038186803b158015611d6657600080fd5b505afa158015611d7a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611d9e91906124ca565b155b92505050611dc7565b6020850151611dc3906001600160a01b0385169084611996565b5060015b949350505050565b801580611e585750604051636eb1769f60e11b81523060048201526001600160a01b03838116602483015284169063dd62ed3e9060440160206040518083038186803b158015611e1e57600080fd5b505afa158015611e32573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190611e5691906124ca565b155b611eca5760405162461bcd60e51b815260206004820152603660248201527f5361666545524332303a20617070726f76652066726f6d206e6f6e2d7a65726f60448201527f20746f206e6f6e2d7a65726f20616c6c6f77616e63650000000000000000000060648201526084016104a8565b6040516001600160a01b038316602482015260448101829052610d9c9084907f095ea7b300000000000000000000000000000000000000000000000000000000906064016119db565b6000611f68826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166120a69092919063ffffffff16565b805190915015610d9c5780806020019051810190611f869190612496565b610d9c5760405162461bcd60e51b815260206004820152602a60248201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e60448201527f6f7420737563636565640000000000000000000000000000000000000000000060648201526084016104a8565b600054610100900460ff1680612011575060005460ff16155b6120745760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104a8565b600054610100900460ff16158015612096576000805461ffff19166101011790555b61209e6120bf565b611ae5612170565b60606120b58484600085612265565b90505b9392505050565b600054610100900460ff16806120d8575060005460ff16155b61213b5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104a8565b600054610100900460ff16158015611ae5576000805461ffff19166101011790558015610859576000805461ff001916905550565b600054610100900460ff1680612189575060005460ff16155b6121ec5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016104a8565b600054610100900460ff1615801561220e576000805461ffff19166101011790555b606580546001600160a01b0319163390811790915560405181906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a3508015610859576000805461ff001916905550565b6060824710156122dd5760405162461bcd60e51b815260206004820152602660248201527f416464726573733a20696e73756666696369656e742062616c616e636520666f60448201527f722063616c6c000000000000000000000000000000000000000000000000000060648201526084016104a8565b843b61232b5760405162461bcd60e51b815260206004820152601d60248201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000060448201526064016104a8565b600080866001600160a01b031685876040516123479190612544565b60006040518083038185875af1925050503d8060008114612384576040519150601f19603f3d011682016040523d82523d6000602084013e612389565b606091505b50915091506123998282866123a4565b979650505050505050565b606083156123b35750816120b8565b8251156123c35782518084602001fd5b8160405162461bcd60e51b81526004016104a89190612560565b6000602082840312156123ee578081fd5b81356120b881612662565b60006020828403121561240a578081fd5b81516120b881612662565b60008060408385031215612427578081fd5b823561243281612662565b9150602083013561244281612662565b809150509250929050565b6000806040838503121561245f578182fd5b823561246a81612662565b9150602083013561244281612677565b60006020828403121561248b578081fd5b81356120b881612677565b6000602082840312156124a7578081fd5b81516120b881612677565b6000602082840312156124c3578081fd5b5035919050565b6000602082840312156124db578081fd5b5051919050565b6000806000606084860312156124f6578081fd5b83359250602084013561250881612662565b9150604084013561251881612677565b809150509250925092565b60008060408385031215612535578182fd5b50508035926020909101359150565b60008251612556818460208701612601565b9190910192915050565b602081526000825180602084015261257f816040850160208701612601565b601f01601f19169190910160400192915050565b600082198211156125a6576125a661264c565b500190565b6000826125c657634e487b7160e01b81526012600452602481fd5b500490565b60008160001904831182151516156125e5576125e561264c565b500290565b6000828210156125fc576125fc61264c565b500390565b60005b8381101561261c578181015183820152602001612604565b8381111561262b576000848401525b50505050565b60006000198214156126455761264561264c565b5060010190565b634e487b7160e01b600052601160045260246000fd5b6001600160a01b038116811461085957600080fd5b801515811461085957600080fdfe4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572a264697066735822122023e6da59cd897c43c3b1ca6d23cecd4fedf0a9ffb5506e0f816886a1ecf7006364736f6c63430008040033";

export class NFTXSimpleFeeDistributor__factory extends ContractFactory {
  constructor(
    ...args: [signer: Signer] | ConstructorParameters<typeof ContractFactory>
  ) {
    if (args.length === 1) {
      super(_abi, _bytecode, args[0]);
    } else {
      super(...args);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<NFTXSimpleFeeDistributor> {
    return super.deploy(overrides || {}) as Promise<NFTXSimpleFeeDistributor>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NFTXSimpleFeeDistributor {
    return super.attach(address) as NFTXSimpleFeeDistributor;
  }
  connect(signer: Signer): NFTXSimpleFeeDistributor__factory {
    return super.connect(signer) as NFTXSimpleFeeDistributor__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): NFTXSimpleFeeDistributorInterface {
    return new utils.Interface(_abi) as NFTXSimpleFeeDistributorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NFTXSimpleFeeDistributor {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as NFTXSimpleFeeDistributor;
  }
}
