/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ERC721HolderUpgradeable,
  ERC721HolderUpgradeableInterface,
} from "../ERC721HolderUpgradeable";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "onERC721Received",
    outputs: [
      {
        internalType: "bytes4",
        name: "",
        type: "bytes4",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506101ff806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063150b7a0214610030575b600080fd5b61006761003e3660046100c5565b7f150b7a0200000000000000000000000000000000000000000000000000000000949350505050565b6040517fffffffff00000000000000000000000000000000000000000000000000000000909116815260200160405180910390f35b803573ffffffffffffffffffffffffffffffffffffffff811681146100c057600080fd5b919050565b600080600080608085870312156100da578384fd5b6100e38561009c565b93506100f16020860161009c565b925060408501359150606085013567ffffffffffffffff80821115610114578283fd5b818701915087601f830112610127578283fd5b8135818111156101395761013961019a565b604051601f8201601f19908116603f011681019083821181831017156101615761016161019a565b816040528281528a6020848701011115610179578586fd5b82602086016020830137918201602001949094529598949750929550505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fdfea26469706673582212201129c20bb54b68ab288c05c80d7760a8797f1d35070e6b908af2dbf826c65e6e64736f6c63430008040033";

export class ERC721HolderUpgradeable__factory extends ContractFactory {
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
  ): Promise<ERC721HolderUpgradeable> {
    return super.deploy(overrides || {}) as Promise<ERC721HolderUpgradeable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC721HolderUpgradeable {
    return super.attach(address) as ERC721HolderUpgradeable;
  }
  connect(signer: Signer): ERC721HolderUpgradeable__factory {
    return super.connect(signer) as ERC721HolderUpgradeable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721HolderUpgradeableInterface {
    return new utils.Interface(_abi) as ERC721HolderUpgradeableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC721HolderUpgradeable {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as ERC721HolderUpgradeable;
  }
}
