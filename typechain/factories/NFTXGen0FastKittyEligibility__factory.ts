/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  NFTXGen0FastKittyEligibility,
  NFTXGen0FastKittyEligibilityInterface,
} from "../NFTXGen0FastKittyEligibility";

const _abi = [
  {
    anonymous: false,
    inputs: [],
    name: "NFTXEligibilityInit",
    type: "event",
  },
  {
    inputs: [],
    name: "__NFTXEligibility_init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "__NFTXEligibility_init_bytes",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "afterMintHook",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "afterRedeemHook",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "beforeMintHook",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "beforeRedeemHook",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "checkAllEligible",
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
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "checkAllIneligible",
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
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "checkEligible",
    outputs: [
      {
        internalType: "bool[]",
        name: "",
        type: "bool[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "checkIsEligible",
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
    name: "finalized",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "targetAsset",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506108d5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100df5760003560e01c80636cd912601161008c578063b3f05b9711610066578063b3f05b97146101c0578063bd8affde1461012c578063ca373f28146101c7578063d2a096e8146101da57600080fd5b80636cd912601461017557806384ca9f8514610195578063b1eb9f87146101b857600080fd5b80634998b7f3116100bd5780634998b7f3146101625780635e2f9b521461012c5780636c47d5951461012c57600080fd5b806306fdde03146100e457806336eb08621461012c5780633d4403ac14610140575b600080fd5b604080518082018252600d81527f47656e30466173744b697474790000000000000000000000000000000000000060208201529051610123919061080f565b60405180910390f35b61013e61013a366004610616565b5050565b005b6040517306012c8cf97bead5deae237070f9587f8e7a266d8152602001610123565b61013e610170366004610707565b6101ed565b610188610183366004610616565b6102bc565b60405161012391906107c9565b6101a86101a3366004610616565b61039b565b6040519015158152602001610123565b61013e6103f7565b60016101a8565b6101a86101d5366004610616565b6104e2565b6101a86101e83660046107b1565b610534565b600054610100900460ff1680610206575060005460ff16155b61027d5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a656400000000000000000000000000000000000060648201526084015b60405180910390fd5b600054610100900460ff1615801561029f576000805461ffff19166101011790555b6102a76103f7565b801561013a576000805461ff00191690555050565b60608160008167ffffffffffffffff8111156102e857634e487b7160e01b600052604160045260246000fd5b604051908082528060200260200182016040528015610311578160200160208202803683370190505b50905060005b828110156103905761034e86868381811061034257634e487b7160e01b600052603260045260246000fd5b9050602002013561053b565b82828151811061036e57634e487b7160e01b600052603260045260246000fd5b911515602092830291909101909101528061038881610862565b915050610317565b509150505b92915050565b600081815b818110156103ec576103cb85858381811061034257634e487b7160e01b600052603260045260246000fd5b6103da57600092505050610395565b806103e481610862565b9150506103a0565b506001949350505050565b600054610100900460ff1680610410575060005460ff16155b6104825760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a65640000000000000000000000000000000000006064820152608401610274565b600054610100900460ff161580156104a4576000805461ffff19166101011790555b6040517fb708568a0e67d40b1324a610ddd779500570f113513f944a791cc7b8b4970dec90600090a180156104df576000805461ff00191690555b50565b600081815b818110156103ec5761051285858381811061034257634e487b7160e01b600052603260045260246000fd5b1561052257600092505050610395565b8061052c81610862565b9150506104e7565b6000610395825b6040517fe98b7f4d00000000000000000000000000000000000000000000000000000000815260048101829052600090819081907306012c8cf97bead5deae237070f9587f8e7a266d9063e98b7f4d906024016101406040518083038186803b1580156105a757600080fd5b505afa1580156105bb573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906105df9190610686565b5098505050505050935050508160001480156105f9575080155b949350505050565b8051801515811461061157600080fd5b919050565b60008060208385031215610628578182fd5b823567ffffffffffffffff8082111561063f578384fd5b818501915085601f830112610652578384fd5b813581811115610660578485fd5b8660208260051b8501011115610674578485fd5b60209290920196919550909350505050565b6000806000806000806000806000806101408b8d0312156106a5578586fd5b6106ae8b610601565b99506106bc60208c01610601565b985060408b0151975060608b0151965060808b0151955060a08b0151945060c08b0151935060e08b015192506101008b015191506101208b015190509295989b9194979a5092959850565b600060208284031215610718578081fd5b813567ffffffffffffffff8082111561072f578283fd5b818401915084601f830112610742578283fd5b81358181111561075457610754610889565b604051601f8201601f19908116603f0116810190838211818310171561077c5761077c610889565b81604052828152876020848701011115610794578586fd5b826020860160208301379182016020019490945295945050505050565b6000602082840312156107c2578081fd5b5035919050565b6020808252825182820181905260009190848201906040850190845b818110156108035783511515835292840192918401916001016107e5565b50909695505050505050565b6000602080835283518082850152825b8181101561083b5785810183015185820160400152820161081f565b8181111561084c5783604083870101525b50601f01601f1916929092016040019392505050565b600060001982141561088257634e487b7160e01b81526011600452602481fd5b5060010190565b634e487b7160e01b600052604160045260246000fdfea2646970667358221220bdd71797e21df1821f31c4828b9720837fa3988719cf91a5cc7d6bf214a3982a64736f6c63430008040033";

export class NFTXGen0FastKittyEligibility__factory extends ContractFactory {
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
  ): Promise<NFTXGen0FastKittyEligibility> {
    return super.deploy(
      overrides || {}
    ) as Promise<NFTXGen0FastKittyEligibility>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NFTXGen0FastKittyEligibility {
    return super.attach(address) as NFTXGen0FastKittyEligibility;
  }
  connect(signer: Signer): NFTXGen0FastKittyEligibility__factory {
    return super.connect(signer) as NFTXGen0FastKittyEligibility__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): NFTXGen0FastKittyEligibilityInterface {
    return new utils.Interface(_abi) as NFTXGen0FastKittyEligibilityInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NFTXGen0FastKittyEligibility {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as NFTXGen0FastKittyEligibility;
  }
}
