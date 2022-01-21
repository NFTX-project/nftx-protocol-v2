/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  NFTXUniqueEligibility,
  NFTXUniqueEligibilityInterface,
} from "../NFTXUniqueEligibility";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "vault",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "negateElig",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "finalize",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
    ],
    name: "NFTXEligibilityInit",
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
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "isEligible",
        type: "bool",
      },
    ],
    name: "UniqueEligibilitiesSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "negateElig",
        type: "bool",
      },
    ],
    name: "negateEligilityOnRedeemSet",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "_vault",
        type: "address",
      },
      {
        internalType: "bool",
        name: "negateElig",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "finalize",
        type: "bool",
      },
      {
        internalType: "uint256[]",
        name: "tokenIds",
        type: "uint256[]",
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
        name: "_configData",
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
    name: "isInitialized",
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
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "isUniqueEligible",
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
    name: "negateEligOnRedeem",
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
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "_negateEligOnRedeem",
        type: "bool",
      },
    ],
    name: "setEligibilityPreferences",
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
      {
        internalType: "bool",
        name: "_isEligible",
        type: "bool",
      },
    ],
    name: "setUniqueEligibilities",
    outputs: [],
    stateMutability: "nonpayable",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611575806100206000396000f3fe608060405234801561001057600080fd5b50600436106101775760003560e01c80636cd91260116100d8578063bd8affde1161008c578063d6eed93711610066578063d6eed937146102f0578063f2fde38b14610304578063fbd5cb201461031757600080fd5b8063bd8affde146101d9578063ca373f28146102ca578063d2a096e8146102dd57600080fd5b806384ca9f85116100bd57806384ca9f851461029e5780638da5cb5b146102b1578063b3f05b97146102c257600080fd5b80636cd9126014610276578063715018a61461029657600080fd5b80633d4403ac1161012f5780634998b7f3116101145780634998b7f3146102505780635e2f9b52146102635780636c47d595146101d957600080fd5b80633d4403ac14610222578063423515c41461023d57600080fd5b806336eb08621161016057806336eb0862146101d9578063392e53cd146101eb5780633942cf361461020f57600080fd5b806306fdde031461017c5780630a7e4096146101c4575b600080fd5b604080518082018252600681527f556e697175650000000000000000000000000000000000000000000000000000602082015290516101bb91906113f9565b60405180910390f35b6101d76101d2366004611107565b61032a565b005b6101d76101e736600461118d565b5050565b6066546101ff90600160a01b900460ff1681565b60405190151581526020016101bb565b6101ff61021d3660046112f6565b61054d565b60005b6040516001600160a01b0390911681526020016101bb565b6101d761024b36600461124d565b610580565b6101d761025e366004611269565b610632565b6101d761027136600461118d565b610725565b61028961028436600461118d565b61078a565b6040516101bb919061138f565b6101d7610869565b6101ff6102ac36600461118d565b61091a565b6033546001600160a01b0316610225565b6101ff610976565b6101ff6102d836600461118d565b6109b1565b6101ff6102eb3660046112f6565b610a03565b6066546101ff90600160a81b900460ff1681565b6101d7610312366004611006565b610a0e565b6101d76103253660046111fd565b610b4d565b600054610100900460ff1680610343575060005460ff16155b6103ab5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084015b60405180910390fd5b600054610100900460ff161580156103cd576000805461ffff19166101011790555b6103d5610bb1565b6001600160a01b03861661042b5760405162461bcd60e51b815260206004820152601360248201527f4f776e657220213d20616464726573732830290000000000000000000000000060448201526064016103a2565b6001600160a01b0385166104815760405162461bcd60e51b815260206004820152601360248201527f5661756c7420213d20616464726573732830290000000000000000000000000060448201526064016103a2565b60668054600160a01b7fffffffffffffffffffffff0000000000000000000000000000000000000000009091166001600160a01b038816171760ff60a81b1916600160a81b861515021790556104d8826001610c74565b7fab54c710aa0ff99f4b7667b84e94caebe3d960186b2588d4309acd5cdf0ab2b7868686868660405161050f959493929190611348565b60405180910390a1821561052a57610525610869565b610533565b61053386610a0e565b8015610545576000805461ff00191690555b505050505050565b60008061055c610100846114a1565b6000818152606560205260409020549091506105788185610d84565b949350505050565b6033546001600160a01b031633146105da5760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016103a2565b60668054821515600160a81b0260ff60a81b199091161790556040517f9038d4f71df700fd5979d0e9b93f30d31a3e528411cf593749e474ee836568599061062790831515815260200190565b60405180910390a150565b600054610100900460ff168061064b575060005460ff16155b6106ae5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016103a2565b600054610100900460ff161580156106d0576000805461ffff19166101011790555b6106d8610bb1565b6000806000806000868060200190518101906106f49190611022565b9450945094509450945061070b858584868561032a565b505050505080156101e7576000805461ff00191690555050565b6066546001600160a01b0316331461073c57600080fd5b606654600160a81b900460ff16156101e7576101e782828080602002602001604051908101604052809392919081815260200183836020028082843760009201829052509250610c74915050565b60608160008167ffffffffffffffff8111156107b657634e487b7160e01b600052604160045260246000fd5b6040519080825280602002602001820160405280156107df578160200160208202803683370190505b50905060005b8281101561085e5761081c86868381811061081057634e487b7160e01b600052603260045260246000fd5b90506020020135610da4565b82828151811061083c57634e487b7160e01b600052603260045260246000fd5b9115156020928302919091019091015280610856816114b5565b9150506107e5565b509150505b92915050565b6033546001600160a01b031633146108c35760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016103a2565b6033546040516000916001600160a01b0316907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908390a36033805473ffffffffffffffffffffffffffffffffffffffff19169055565b600081815b8181101561096b5761094a85858381811061081057634e487b7160e01b600052603260045260246000fd5b61095957600092505050610863565b80610963816114b5565b91505061091f565b506001949350505050565b606654600090600160a01b900460ff1680156109ac575060006109a16033546001600160a01b031690565b6001600160a01b0316145b905090565b600081815b8181101561096b576109e185858381811061081057634e487b7160e01b600052603260045260246000fd5b156109f157600092505050610863565b806109fb816114b5565b9150506109b6565b600061086382610da4565b6033546001600160a01b03163314610a685760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016103a2565b6001600160a01b038116610ae45760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f646472657373000000000000000000000000000000000000000000000000000060648201526084016103a2565b6033546040516001600160a01b038084169216907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a36033805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b6033546001600160a01b03163314610ba75760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260448201526064016103a2565b6101e78282610c74565b600054610100900460ff1680610bca575060005460ff16155b610c2d5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016103a2565b600054610100900460ff16158015610c4f576000805461ffff19166101011790555b610c57610daf565b610c5f610e60565b8015610c71576000805461ff00191690555b50565b600080805260656020527fffdfc1249c027f9191656349feb0761381bb32c9f557e01f419fd08754bf5a1b5490805b8451811015610d32576000858281518110610cce57634e487b7160e01b600052603260045260246000fd5b60200260200101519050600061010082610ce891906114a1565b9050838114610d10576000938452606560205260408085209590955580845293909220549291825b610d1b858388610f62565b945050508080610d2a906114b5565b915050610ca3565b5060008181526065602052604090819020839055517ffacde3821ab1224682dd0ab6a805f71860b6ca6982ad044c8c4927ea4c6f140190610d7690869086906113d5565b60405180910390a150505050565b600080610d93610100846114dc565b9390931c6001908116149392505050565b60006108638261054d565b600054610100900460ff1680610dc8575060005460ff16155b610e2b5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016103a2565b600054610100900460ff16158015610c5f576000805461ffff19166101011790558015610c71576000805461ff001916905550565b600054610100900460ff1680610e79575060005460ff16155b610edc5760405162461bcd60e51b815260206004820152602e60248201527f496e697469616c697a61626c653a20636f6e747261637420697320616c72656160448201526d191e481a5b9a5d1a585b1a5e995960921b60648201526084016103a2565b600054610100900460ff16158015610efe576000805461ffff19166101011790555b6033805473ffffffffffffffffffffffffffffffffffffffff19163390811790915560405181906000907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0908290a3508015610c71576000805461ff001916905550565b600080610f71610100856114dc565b90508215610f86576001901b84179050610f90565b6001901b19841690505b9392505050565b600082601f830112610fa7578081fd5b81356020610fbc610fb78361147d565b61144c565b80838252828201915082860187848660051b8901011115610fdb578586fd5b855b85811015610ff957813584529284019290840190600101610fdd565b5090979650505050505050565b600060208284031215611017578081fd5b8135610f908161151c565b600080600080600060a08688031215611039578081fd5b85516110448161151c565b809550506020808701516110578161151c565b604088015190955061106881611531565b606088015190945061107981611531565b608088015190935067ffffffffffffffff811115611095578283fd5b8701601f810189136110a5578283fd5b80516110b3610fb78261147d565b8082825284820191508484018c868560051b87010111156110d2578687fd5b8694505b838510156110f45780518352600194909401939185019185016110d6565b5080955050505050509295509295909350565b600080600080600060a0868803121561111e578081fd5b85356111298161151c565b945060208601356111398161151c565b9350604086013561114981611531565b9250606086013561115981611531565b9150608086013567ffffffffffffffff811115611174578182fd5b61118088828901610f97565b9150509295509295909350565b6000806020838503121561119f578182fd5b823567ffffffffffffffff808211156111b6578384fd5b818501915085601f8301126111c9578384fd5b8135818111156111d7578485fd5b8660208260051b85010111156111eb578485fd5b60209290920196919550909350505050565b6000806040838503121561120f578182fd5b823567ffffffffffffffff811115611225578283fd5b61123185828601610f97565b925050602083013561124281611531565b809150509250929050565b60006020828403121561125e578081fd5b8135610f9081611531565b6000602080838503121561127b578182fd5b823567ffffffffffffffff80821115611292578384fd5b818501915085601f8301126112a5578384fd5b8135818111156112b7576112b7611506565b6112c9601f8201601f1916850161144c565b915080825286848285010111156112de578485fd5b80848401858401378101909201929092529392505050565b600060208284031215611307578081fd5b5035919050565b6000815180845260208085019450808401835b8381101561133d57815187529582019590820190600101611321565b509495945050505050565b60006001600160a01b0380881683528087166020840152508415156040830152831515606083015260a0608083015261138460a083018461130e565b979650505050505050565b6020808252825182820181905260009190848201906040850190845b818110156113c95783511515835292840192918401916001016113ab565b50909695505050505050565b6040815260006113e8604083018561130e565b905082151560208301529392505050565b6000602080835283518082850152825b8181101561142557858101830151858201604001528201611409565b818111156114365783604083870101525b50601f01601f1916929092016040019392505050565b604051601f8201601f1916810167ffffffffffffffff8111828210171561147557611475611506565b604052919050565b600067ffffffffffffffff82111561149757611497611506565b5060051b60200190565b6000826114b0576114b06114f0565b500490565b60006000198214156114d557634e487b7160e01b81526011600452602481fd5b5060010190565b6000826114eb576114eb6114f0565b500690565b634e487b7160e01b600052601260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b0381168114610c7157600080fd5b8015158114610c7157600080fdfea264697066735822122069379b6489da598fed9cef0975636608a7150255dcc2852d1abe1c7d44af5fe964736f6c63430008040033";

export class NFTXUniqueEligibility__factory extends ContractFactory {
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
  ): Promise<NFTXUniqueEligibility> {
    return super.deploy(overrides || {}) as Promise<NFTXUniqueEligibility>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): NFTXUniqueEligibility {
    return super.attach(address) as NFTXUniqueEligibility;
  }
  connect(signer: Signer): NFTXUniqueEligibility__factory {
    return super.connect(signer) as NFTXUniqueEligibility__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): NFTXUniqueEligibilityInterface {
    return new utils.Interface(_abi) as NFTXUniqueEligibilityInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): NFTXUniqueEligibility {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as NFTXUniqueEligibility;
  }
}
