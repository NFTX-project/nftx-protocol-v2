/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IPrevNftxContract,
  IPrevNftxContractInterface,
} from "../IPrevNftxContract";

const _abi = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "vaultId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nftId",
        type: "uint256",
      },
    ],
    name: "isEligible",
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
];

export class IPrevNftxContract__factory {
  static readonly abi = _abi;
  static createInterface(): IPrevNftxContractInterface {
    return new utils.Interface(_abi) as IPrevNftxContractInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IPrevNftxContract {
    return new Contract(address, _abi, signerOrProvider) as IPrevNftxContract;
  }
}
