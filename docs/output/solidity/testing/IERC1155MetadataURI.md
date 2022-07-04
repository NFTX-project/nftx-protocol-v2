# Solidity API

## IERC1155MetadataURI

_Interface of the optional ERC1155MetadataExtension interface, as defined
in the https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[EIP].

_Available since v3.1.__

### uri

```solidity
function uri(uint256 id) external view returns (string)
```

_Returns the URI for token type `id`.

If the `\{id\}` substring is present in the URI, it must be replaced by
clients with the actual token type ID._

