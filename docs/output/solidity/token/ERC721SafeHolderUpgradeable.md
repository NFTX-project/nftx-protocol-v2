# Solidity API

## ERC721SafeHolderUpgradeable

_Implementation of the {IERC721Receiver} interface.

Accepts all token transfers.
Make sure the contract is able to use its token with {IERC721-safeTransferFrom}, {IERC721-approve} or {IERC721-setApprovalForAll}._

### onERC721Received

```solidity
function onERC721Received(address operator, address, uint256, bytes) public virtual returns (bytes4)
```

_See {IERC721Receiver-onERC721Received}.

Always returns `IERC721Receiver.onERC721Received.selector`._

