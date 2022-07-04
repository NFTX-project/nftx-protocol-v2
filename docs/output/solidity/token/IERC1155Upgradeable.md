# Solidity API

## IERC1155Upgradeable

_Required interface of an ERC1155 compliant contract, as defined in the
https://eips.ethereum.org/EIPS/eip-1155[EIP].

_Available since v3.1.__

### TransferSingle

```solidity
event TransferSingle(address operator, address from, address to, uint256 id, uint256 value)
```

_Emitted when `value` tokens of token type `id` are transferred from `from` to `to` by `operator`._

### TransferBatch

```solidity
event TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)
```

_Equivalent to multiple {TransferSingle} events, where `operator`, `from` and `to` are the same for all
transfers._

### ApprovalForAll

```solidity
event ApprovalForAll(address account, address operator, bool approved)
```

_Emitted when `account` grants or revokes permission to `operator` to transfer their tokens, according to
`approved`._

### URI

```solidity
event URI(string value, uint256 id)
```

_Emitted when the URI for token type `id` changes to `value`, if it is a non-programmatic URI.

If an {URI} event was emitted for `id`, the standard
https://eips.ethereum.org/EIPS/eip-1155#metadata-extensions[guarantees] that `value` will equal the value
returned by {IERC1155MetadataURI-uri}._

### balanceOf

```solidity
function balanceOf(address account, uint256 id) external view returns (uint256)
```

_Returns the amount of tokens of token type `id` owned by `account`.

Requirements:

- `account` cannot be the zero address._

### balanceOfBatch

```solidity
function balanceOfBatch(address[] accounts, uint256[] ids) external view returns (uint256[])
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {balanceOf}.

Requirements:

- `accounts` and `ids` must have the same length._

### setApprovalForAll

```solidity
function setApprovalForAll(address operator, bool approved) external
```

_Grants or revokes permission to `operator` to transfer the caller's tokens, according to `approved`,

Emits an {ApprovalForAll} event.

Requirements:

- `operator` cannot be the caller._

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool)
```

_Returns true if `operator` is approved to transfer ``account``'s tokens.

See {setApprovalForAll}._

### safeTransferFrom

```solidity
function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data) external
```

_Transfers `amount` tokens of token type `id` from `from` to `to`.

Emits a {TransferSingle} event.

Requirements:

- `to` cannot be the zero address.
- If the caller is not `from`, it must be have been approved to spend ``from``'s tokens via {setApprovalForAll}.
- `from` must have a balance of tokens of type `id` of at least `amount`.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
acceptance magic value._

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data) external
```

_xref:ROOT:erc1155.adoc#batch-operations[Batched] version of {safeTransferFrom}.

Emits a {TransferBatch} event.

Requirements:

- `ids` and `amounts` must have the same length.
- If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155BatchReceived} and return the
acceptance magic value._

