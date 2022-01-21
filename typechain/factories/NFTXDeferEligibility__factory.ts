/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  NFTXDeferEligibility,
  NFTXDeferEligibilityInterface,
} from "../NFTXDeferEligibility";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "deferAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deferralVaultId",
        type: "uint256",
      },
    ],
    name: "NFTXEligibilityInit",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_deferAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_deferVaultId",
        type: "uint256",
      },
    ],
    name: "__NFTXEligibility_init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "configData",
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
    name: "deferAddress",
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
    name: "deferVaultId",
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
  "0x608060405234801561001057600080fd5b506109ce806100206000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c80637a90169211610097578063bd8affde11610066578063bd8affde14610142578063ca373f28146101fe578063d2a096e814610211578063f7be19f11461022457600080fd5b80637a901692146101a457806384ca9f85146101bb578063a8bdfa2b146101de578063b3f05b97146101f757600080fd5b80634998b7f3116100d35780634998b7f3146101715780635e2f9b52146101425780636c47d595146101425780636cd912601461018457600080fd5b806306fdde03146100fa57806336eb0862146101425780633d4403ac14610156575b600080fd5b604080518082018252600581527f44656665720000000000000000000000000000000000000000000000000000006020820152905161013991906108f0565b60405180910390f35b610154610150366004610751565b5050565b005b60005b6040516001600160a01b039091168152602001610139565b61015461017f3660046107e8565b610237565b610197610192366004610751565b610325565b60405161013991906108aa565b6101ad60015481565b604051908152602001610139565b6101ce6101c9366004610751565b610404565b6040519015158152602001610139565b600054610159906201000090046001600160a01b031681565b60016101ce565b6101ce61020c366004610751565b610460565b6101ce61021f366004610892565b6104b2565b610154610232366004610726565b6104bd565b600054610100900460ff1680610250575060005460ff16155b6102c75760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a656400000000000000000000000000000000000060648201526084015b60405180910390fd5b600054610100900460ff161580156102e9576000805461ffff19166101011790555b6000808380602001905181019061030091906106f9565b9150915061030e82826104bd565b50508015610150576000805461ff00191690555050565b60608160008167ffffffffffffffff81111561035157634e487b7160e01b600052604160045260246000fd5b60405190808252806020026020018201604052801561037a578160200160208202803683370190505b50905060005b828110156103f9576103b78686838181106103ab57634e487b7160e01b600052603260045260246000fd5b90506020020135610653565b8282815181106103d757634e487b7160e01b600052603260045260246000fd5b91151560209283029190910190910152806103f181610943565b915050610380565b509150505b92915050565b600081815b81811015610455576104348585838181106103ab57634e487b7160e01b600052603260045260246000fd5b610443576000925050506103fe565b8061044d81610943565b915050610409565b506001949350505050565b600081815b81811015610455576104908585838181106103ab57634e487b7160e01b600052603260045260246000fd5b156104a0576000925050506103fe565b806104aa81610943565b915050610465565b60006103fe82610653565b600054610100900460ff16806104d6575060005460ff16155b6105485760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201527f647920696e697469616c697a656400000000000000000000000000000000000060648201526084016102be565b600054610100900460ff1615801561056a576000805461ffff19166101011790555b6001600160a01b0383166105c05760405162461bcd60e51b815260206004820152601a60248201527f64656665724164647265737320213d206164647265737328302900000000000060448201526064016102be565b600080547fffffffffffffffffffff0000000000000000000000000000000000000000ffff16620100006001600160a01b03861690810291909117909155600183905560408051918252602082018490527f7f42b8fc71aace6a5941e31ba0be200e39ccb42e6f1221a5114fd82e34ec4e35910160405180910390a1801561064e576000805461ff00191690555b505050565b600080546001546040517ff09e82e2000000000000000000000000000000000000000000000000000000008152600481019190915260248101849052620100009091046001600160a01b03169063f09e82e29060440160206040518083038186803b1580156106c157600080fd5b505afa1580156106d5573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103fe91906107c1565b6000806040838503121561070b578182fd5b825161071681610980565b6020939093015192949293505050565b60008060408385031215610738578182fd5b823561074381610980565b946020939093013593505050565b60008060208385031215610763578182fd5b823567ffffffffffffffff8082111561077a578384fd5b818501915085601f83011261078d578384fd5b81358181111561079b578485fd5b8660208260051b85010111156107af578485fd5b60209290920196919550909350505050565b6000602082840312156107d2578081fd5b815180151581146107e1578182fd5b9392505050565b6000602082840312156107f9578081fd5b813567ffffffffffffffff80821115610810578283fd5b818401915084601f830112610823578283fd5b8135818111156108355761083561096a565b604051601f8201601f19908116603f0116810190838211818310171561085d5761085d61096a565b81604052828152876020848701011115610875578586fd5b826020860160208301379182016020019490945295945050505050565b6000602082840312156108a3578081fd5b5035919050565b6020808252825182820181905260009190848201906040850190845b818110156108e45783511515835292840192918401916001016108c6565b50909695505050505050565b6000602080835283518082850152825b8181101561091c57858101830151858201604001528201610900565b8181111561092d5783604083870101525b50601f01601f1916929092016040019392505050565b600060001982141561096357634e487b7160e01b81526011600452602481fd5b5060010190565b634e487b7160e01b600052604160045260246000fd5b6001600160a01b038116811461099557600080fd5b5056fea2646970667358221220f65b631793655a8d4118096612f1611964573d0519b0c1abeef1e3725cef3fed64736f6c63430008040033";

export class NFTXDeferEligibility__factory extends ContractFactory {
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
  ): Promise<NFTXDeferEligibility> {
    return super.deploy(overrides || {}) as Promise<NFTXDeferEligibility>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NFTXDeferEligibility {
    return super.attach(address) as NFTXDeferEligibility;
  }
  connect(signer: Signer): NFTXDeferEligibility__factory {
    return super.connect(signer) as NFTXDeferEligibility__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): NFTXDeferEligibilityInterface {
    return new utils.Interface(_abi) as NFTXDeferEligibilityInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NFTXDeferEligibility {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as NFTXDeferEligibility;
  }
}
