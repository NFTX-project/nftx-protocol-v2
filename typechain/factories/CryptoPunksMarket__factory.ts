/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Signer,
  utils,
  Contract,
  ContractFactory,
  PayableOverrides,
} from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CryptoPunksMarket,
  CryptoPunksMarketInterface,
} from "../CryptoPunksMarket";

const _abi = [
  {
    inputs: [],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "Assign",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromAddress",
        type: "address",
      },
    ],
    name: "PunkBidEntered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromAddress",
        type: "address",
      },
    ],
    name: "PunkBidWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromAddress",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toAddress",
        type: "address",
      },
    ],
    name: "PunkBought",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "PunkNoLongerForSale",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "minValue",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toAddress",
        type: "address",
      },
    ],
    name: "PunkOffered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "PunkTransfer",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minPrice",
        type: "uint256",
      },
    ],
    name: "acceptBidForPunk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "allInitialOwnersAssigned",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "allPunksAssigned",
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
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
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
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "buyPunk",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "enterBidForPunk",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "getPunk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "imageHash",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
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
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextPunkIndexToAssign",
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
        name: "punkIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minSalePriceInWei",
        type: "uint256",
      },
    ],
    name: "offerPunkForSale",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "minSalePriceInWei",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "toAddress",
        type: "address",
      },
    ],
    name: "offerPunkForSaleToAddress",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "pendingWithdrawals",
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
        name: "",
        type: "uint256",
      },
    ],
    name: "punkBids",
    outputs: [
      {
        internalType: "bool",
        name: "hasBid",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "bidder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "value",
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
        name: "",
        type: "uint256",
      },
    ],
    name: "punkIndexToAddress",
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
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "punkNoLongerForSale",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "punksOfferedForSale",
    outputs: [
      {
        internalType: "bool",
        name: "isForSale",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "seller",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "minValue",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "onlySellTo",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "punksRemainingToAssign",
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
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "setInitialOwner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "addresses",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "indices",
        type: "uint256[]",
      },
    ],
    name: "setInitialOwners",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "standard",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
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
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "transferPunk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "punkIndex",
        type: "uint256",
      },
    ],
    name: "withdrawBidForPunk",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60e0604090815260808181529062001eae60a03980516200002991600091602090910190620000fe565b5060408051808201909152600b8082526a43727970746f50756e6b7360a81b60209092019182526200005e91600291620000fe565b5060006007556008805460ff19169055600180546001600160a01b031916331790556005600681905560095560408051808201909152600b8082526a43525950544f50554e4b5360a81b6020909201918252620000be91600391620000fe565b506040805180820190915260058082526450554e4b5360d81b6020909201918252620000ed91600491620000fe565b506005805460ff19169055620001e1565b8280546200010c90620001a4565b90600052602060002090601f0160209004810192826200013057600085556200017b565b82601f106200014b57805160ff19168380011785556200017b565b828001600101855582156200017b579182015b828111156200017b5782518255916020019190600101906200015e565b50620001899291506200018d565b5090565b5b808211156200018957600081556001016200018e565b600181811c90821680620001b957607f821691505b60208210811415620001db57634e487b7160e01b600052602260045260246000fd5b50919050565b611cbd80620001f16000396000f3fe6080604052600436106101ac5760003560e01c806370a08231116100ec578063a75a90491161008a578063c44193c311610064578063c44193c314610560578063c81d1d5b14610580578063f3f43703146105a0578063f6eeff1e146105cd57600080fd5b8063a75a90491461050a578063bf31196f1461052a578063c0d6ce631461054a57600080fd5b80638264fe98116100c65780638264fe98146104a25780638b72a2ec146104b557806395d89b41146104d5578063979bc638146104ea57600080fd5b806370a08231146104365780637ecedac9146104635780638126c38a1461047857600080fd5b806339c5dde61161015957806352f29a251161013357806352f29a251461033a57806358178168146103505780635a3b7e421461039e5780636e743fa9146103b357600080fd5b806339c5dde6146102f05780633ccfd60b1461031057806351605d801461032557600080fd5b806318160ddd1161018a57806318160ddd1461028057806323165b75146102a4578063313ce567146102c457600080fd5b806306fdde03146101b1578063088f11f3146101dc578063091dbfd21461026b575b600080fd5b3480156101bd57600080fd5b506101c66105ed565b6040516101d39190611b2e565b60405180910390f35b3480156101e857600080fd5b506102356101f7366004611ac1565b600c602052600090815260409020805460018201546002830154600384015460049094015460ff9093169391926001600160a01b0391821692911685565b60408051951515865260208601949094526001600160a01b0392831693850193909352606084015216608082015260a0016101d3565b61027e610279366004611ac1565b61067b565b005b34801561028c57600080fd5b5061029660065481565b6040519081526020016101d3565b3480156102b057600080fd5b5061027e6102bf366004611ad9565b610832565b3480156102d057600080fd5b506005546102de9060ff1681565b60405160ff90911681526020016101d3565b3480156102fc57600080fd5b5061027e61030b366004611a00565b610bd9565b34801561031c57600080fd5b5061027e610c6d565b34801561033157600080fd5b506101c6610cc1565b34801561034657600080fd5b5061029660075481565b34801561035c57600080fd5b5061038661036b366004611ac1565b600a602052600090815260409020546001600160a01b031681565b6040516001600160a01b0390911681526020016101d3565b3480156103aa57600080fd5b506101c6610cce565b3480156103bf57600080fd5b506104056103ce366004611ac1565b600d60205260009081526040902080546001820154600283015460039093015460ff9092169290916001600160a01b039091169084565b6040516101d39493929190931515845260208401929092526001600160a01b03166040830152606082015260800190565b34801561044257600080fd5b506102966104513660046119b6565b600b6020526000908152604090205481565b34801561046f57600080fd5b5061027e610cdb565b34801561048457600080fd5b506008546104929060ff1681565b60405190151581526020016101d3565b61027e6104b0366004611ac1565b610d01565b3480156104c157600080fd5b5061027e6104d03660046119d7565b61100c565b3480156104e157600080fd5b506101c661125d565b3480156104f657600080fd5b5061027e610505366004611ac1565b61126a565b34801561051657600080fd5b5061027e6105253660046119d7565b61140a565b34801561053657600080fd5b5061027e610545366004611afa565b61155a565b34801561055657600080fd5b5061029660095481565b34801561056c57600080fd5b5061027e61057b366004611ad9565b611663565b34801561058c57600080fd5b5061027e61059b366004611ac1565b611761565b3480156105ac57600080fd5b506102966105bb3660046119b6565b600e6020526000908152604090205481565b3480156105d957600080fd5b5061027e6105e8366004611ac1565b611836565b600380546105fa90611c05565b80601f016020809104026020016040519081016040528092919081815260200182805461062690611c05565b80156106735780601f1061064857610100808354040283529160200191610673565b820191906000526020600020905b81548152906001019060200180831161065657829003601f168201915b505050505081565b6005811061068857600080fd5b60085460ff1661069757600080fd5b6000818152600a60205260409020546001600160a01b03166106b857600080fd5b6000818152600a60205260409020546001600160a01b03163314156106dc57600080fd5b346106e657600080fd5b6000818152600d60209081526040918290208251608081018452815460ff161515815260018201549281019290925260028101546001600160a01b03169282019290925260039091015460608201819052341161074257600080fd5b6060810151156107835760608101516040808301516001600160a01b03166000908152600e602052908120805490919061077d908490611bd6565b90915550505b604080516080810182526001808252602080830186815233848601818152346060870181815260008b8152600d87528990209751885460ff1916901515178855935195870195909555516002860180546001600160a01b0319166001600160a01b0390921691909117905590516003909401939093559251908152909184917f5b859394fabae0c1ba88baffe67e751ab5248d2e879028b8c8d6897b0519f56a91015b60405180910390a35050565b6005821061083f57600080fd5b60085460ff1661084e57600080fd5b6000828152600a60205260409020546001600160a01b0316331461087157600080fd5b6000828152600d60209081526040918290208251608081018452815460ff161515815260018201549281019290925260028101546001600160a01b031692820192909252600390910154606082018190523391906108ce57600080fd5b82816060015110156108df57600080fd5b6040818101516000868152600a602090815283822080546001600160a01b0319166001600160a01b039485161790559185168152600b90915290812080549161092783611bee565b90915550506040808201516001600160a01b03166000908152600b60205290812080549161095483611c40565b919050555080604001516001600160a01b0316826001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60016040516109a391815260200190565b60405180910390a36040518060a0016040528060001515815260200185815260200182604001516001600160a01b031681526020016000815260200160006001600160a01b0316815250600c600086815260200190815260200160002060008201518160000160006101000a81548160ff0219169083151502179055506020820151816001015560408201518160020160006101000a8154816001600160a01b0302191690836001600160a01b031602179055506060820151816003015560808201518160040160006101000a8154816001600160a01b0302191690836001600160a01b03160217905550905050600081606001519050604051806080016040528060001515815260200186815260200160006001600160a01b031681526020016000815250600d600087815260200190815260200160002060008201518160000160006101000a81548160ff0219169083151502179055506020820151816001015560408201518160020160006101000a8154816001600160a01b0302191690836001600160a01b031602179055506060820151816003015590505080600e6000856001600160a01b03166001600160a01b031681526020019081526020016000206000828254610b759190611bd6565b9250508190555081604001516001600160a01b0316836001600160a01b0316867f58e5d5a525e3b40bc15abaa38b5882678db1ee68befd2f60bafe3a7fd06db9e38560600151604051610bca91815260200190565b60405180910390a45050505050565b6001546001600160a01b03163314610bf057600080fd5b815160005b81811015610c6757610c55848281518110610c2057634e487b7160e01b600052603260045260246000fd5b6020026020010151848381518110610c4857634e487b7160e01b600052603260045260246000fd5b602002602001015161140a565b80610c5f81611c40565b915050610bf5565b50505050565b60085460ff16610c7c57600080fd5b336000818152600e6020526040808220805490839055905190929183156108fc02918491818181858888f19350505050158015610cbd573d6000803e3d6000fd5b5050565b600080546105fa90611c05565b600280546105fa90611c05565b6001546001600160a01b03163314610cf257600080fd5b6008805460ff19166001179055565b60085460ff16610d1057600080fd5b6000818152600c6020908152604091829020825160a081018452815460ff161515815260018201549281019290925260028101546001600160a01b03908116938301939093526003810154606083015260040154909116608082015260058210610d7957600080fd5b8051610d8457600080fd5b60808101516001600160a01b031615801590610dad575060808101516001600160a01b03163314155b15610db757600080fd5b8060600151341015610dc857600080fd5b6000828152600a60205260409081902054908201516001600160a01b03908116911614610df457600080fd5b6040808201516000848152600a602090815283822080546001600160a01b031916331790556001600160a01b0383168252600b905291822080549192610e3983611bee565b9091555050336000908152600b60205260408120805491610e5983611c40565b90915550506040516001815233906001600160a01b038316907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a3610ea883611836565b6001600160a01b0381166000908152600e602052604081208054349290610ed0908490611bd6565b909155505060405134815233906001600160a01b0383169085907f58e5d5a525e3b40bc15abaa38b5882678db1ee68befd2f60bafe3a7fd06db9e39060200160405180910390a46000838152600d60209081526040918290208251608081018452815460ff161515815260018201549281019290925260028101546001600160a01b031692820183905260030154606082015290331415610c67576060810151336000908152600e602052604081208054909190610f8f908490611bd6565b9091555050604080516080810182526000808252602080830188815283850183815260608501848152998452600d909252939091209151825460ff19169015151782559151600182015590516002820180546001600160a01b0319166001600160a01b039092169190911790559351600390940193909355505050565b60085460ff1661101b57600080fd5b6000818152600a60205260409020546001600160a01b0316331461103e57600080fd5b6005811061104b57600080fd5b6000818152600c602052604090205460ff161561106b5761106b81611836565b6000818152600a6020908152604080832080546001600160a01b0319166001600160a01b038716179055338352600b90915281208054916110ab83611bee565b90915550506001600160a01b0382166000908152600b602052604081208054916110d483611c40565b9091555050604051600181526001600160a01b0383169033907fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9060200160405180910390a36040518181526001600160a01b0383169033907f05af636b70da6819000c49f85b21fa82081c632069bb626f30932034099107d89060200160405180910390a36000818152600d60209081526040918290208251608081018452815460ff161515815260018201549281019290925260028101546001600160a01b039081169383018490526003909101546060830152909190841614156112585760608101516001600160a01b0384166000908152600e6020526040812080549091906111e2908490611bd6565b9091555050604080516080810182526000808252602080830186815283850183815260608501848152888552600d909352949092209251835460ff19169015151783559051600183015591516002820180546001600160a01b0319166001600160a01b0390921691909117905590516003909101555b505050565b600480546105fa90611c05565b6005811061127757600080fd5b60085460ff1661128657600080fd5b6000818152600a60205260409020546001600160a01b03166112a757600080fd5b6000818152600a60205260409020546001600160a01b03163314156112cb57600080fd5b6000818152600d60209081526040918290208251608081018452815460ff161515815260018201549281019290925260028101546001600160a01b031692820183905260030154606082015290331461132357600080fd5b336001600160a01b0316827f6f30e1ee4d81dcc7a8a478577f65d2ed2edb120565960ac45fe7c50551c87932836060015160405161136391815260200190565b60405180910390a36060818101516040805160808101825260008082526020808301888152838501838152968401838152898452600d9092528483209351845460ff191690151517845551600184015594516002830180546001600160a01b0319166001600160a01b03909216919091179055935160039091015551909133916108fc84150291849190818181858888f19350505050158015610c67573d6000803e3d6000fd5b6001546001600160a01b0316331461142157600080fd5b60085460ff161561143157600080fd5b6005811061143e57600080fd5b6000818152600a60205260409020546001600160a01b03838116911614610cbd576000818152600a60205260409020546001600160a01b0316156114b6576000818152600a60209081526040808320546001600160a01b03168352600b90915281208054916114ac83611bee565b91905055506114cc565b600980549060006114c683611bee565b91905055505b6000818152600a6020908152604080832080546001600160a01b0319166001600160a01b0387169081179091558352600b909152812080549161150e83611c40565b9190505550816001600160a01b03167f8a0e37b73a0d9c82e205d4d1a3ff3d0b57ce5f4d7bccf6bac03336dc101cb7ba8260405161154e91815260200190565b60405180910390a25050565b60085460ff1661156957600080fd5b6000838152600a60205260409020546001600160a01b0316331461158c57600080fd5b6005831061159957600080fd5b6040805160a0810182526001808252602080830187815233848601908152606085018881526001600160a01b038881166080880181815260008d8152600c88528a90209851895460ff191690151517895594519688019690965591516002870180546001600160a01b031990811692851692909217905590516003870155915160049095018054909216941693909317909255915184815285917f3c7b682d5da98001a9b8cbda6c647d2c63d698a4184fd1d55e2ce7b66f5d21eb910160405180910390a3505050565b60085460ff1661167257600080fd5b6000828152600a60205260409020546001600160a01b0316331461169557600080fd5b600582106116a257600080fd5b6040805160a0810182526001808252602080830186815233848601908152606085018781526000608087018181528a8252600c86528882209751885460ff191690151517885593519587019590955590516002860180546001600160a01b03199081166001600160a01b0393841617909155915160038701559151600490950180549091169490911693909317909255915183815284917f3c7b682d5da98001a9b8cbda6c647d2c63d698a4184fd1d55e2ce7b66f5d21eb9101610826565b60085460ff1661177057600080fd5b60095461177c57600080fd5b6000818152600a60205260409020546001600160a01b03161561179e57600080fd5b600581106117ab57600080fd5b6000818152600a6020908152604080832080546001600160a01b031916339081179091558352600b90915281208054916117e483611c40565b9091555050600980549060006117f983611bee565b909155505060405181815233907f8a0e37b73a0d9c82e205d4d1a3ff3d0b57ce5f4d7bccf6bac03336dc101cb7ba9060200160405180910390a250565b60085460ff1661184557600080fd5b6000818152600a60205260409020546001600160a01b0316331461186857600080fd5b6005811061187557600080fd5b6040805160a08101825260008082526020808301858152338486019081526060850184815260808601858152888652600c9094528685209551865460ff191690151517865591516001860155516002850180546001600160a01b03199081166001600160a01b0393841617909155915160038601559151600490940180549091169390911692909217909155905182917fb0e0a660b4e50f26f0b7ce75c24655fc76cc66e3334a54ff410277229fa10bd491a250565b80356001600160a01b038116811461194257600080fd5b919050565b600082601f830112611957578081fd5b8135602061196c61196783611bb2565b611b81565b80838252828201915082860187848660051b890101111561198b578586fd5b855b858110156119a95781358452928401929084019060010161198d565b5090979650505050505050565b6000602082840312156119c7578081fd5b6119d08261192b565b9392505050565b600080604083850312156119e9578081fd5b6119f28361192b565b946020939093013593505050565b60008060408385031215611a12578182fd5b823567ffffffffffffffff80821115611a29578384fd5b818501915085601f830112611a3c578384fd5b81356020611a4c61196783611bb2565b8083825282820191508286018a848660051b8901011115611a6b578889fd5b8896505b84871015611a9457611a808161192b565b835260019690960195918301918301611a6f565b5096505086013592505080821115611aaa578283fd5b50611ab785828601611947565b9150509250929050565b600060208284031215611ad2578081fd5b5035919050565b60008060408385031215611aeb578182fd5b50508035926020909101359150565b600080600060608486031215611b0e578081fd5b8335925060208401359150611b256040850161192b565b90509250925092565b6000602080835283518082850152825b81811015611b5a57858101830151858201604001528201611b3e565b81811115611b6b5783604083870101525b50601f01601f1916929092016040019392505050565b604051601f8201601f1916810167ffffffffffffffff81118282101715611baa57611baa611c71565b604052919050565b600067ffffffffffffffff821115611bcc57611bcc611c71565b5060051b60200190565b60008219821115611be957611be9611c5b565b500190565b600081611bfd57611bfd611c5b565b506000190190565b600181811c90821680611c1957607f821691505b60208210811415611c3a57634e487b7160e01b600052602260045260246000fd5b50919050565b6000600019821415611c5457611c54611c5b565b5060010190565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052604160045260246000fdfea264697066735822122074ea612720387764f9a0b3ad7b3c78e7375a95165e2054ecd3a625d619866d9e64736f6c6343000804003361633339616634373933313139656534366262666633353164386362366235663233646136303232323132366164643432363865323631313939613239323162";

export class CryptoPunksMarket__factory extends ContractFactory {
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
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<CryptoPunksMarket> {
    return super.deploy(overrides || {}) as Promise<CryptoPunksMarket>;
  }
  getDeployTransaction(
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): CryptoPunksMarket {
    return super.attach(address) as CryptoPunksMarket;
  }
  connect(signer: Signer): CryptoPunksMarket__factory {
    return super.connect(signer) as CryptoPunksMarket__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CryptoPunksMarketInterface {
    return new utils.Interface(_abi) as CryptoPunksMarketInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CryptoPunksMarket {
    return new Contract(address, _abi, signerOrProvider) as CryptoPunksMarket;
  }
}
