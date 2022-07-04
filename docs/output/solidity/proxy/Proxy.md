# Solidity API

## Proxy

_This abstract contract provides a fallback function that delegates all calls to another contract using the EVM
instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to
be specified by overriding the virtual {_implementation} function.

Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a
different contract through the {_delegate} function.

The success and return data of the delegated call will be returned back to the caller of the proxy._

### _delegate

```solidity
function _delegate(address implementation) internal virtual
```

_Delegates the current call to `implementation`.

This function does not return to its internall call site, it will return directly to the external caller._

### _implementation

```solidity
function _implementation() internal view virtual returns (address)
```

_This is a virtual function that should be overriden so it returns the address to which the fallback function
and {_fallback} should delegate._

### _fallback

```solidity
function _fallback() internal virtual
```

_Delegates the current call to the address returned by `_implementation()`.

This function does not return to its internall call site, it will return directly to the external caller._

### fallback

```solidity
fallback() external payable virtual
```

_Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other
function in the contract matches the call data._

### receive

```solidity
receive() external payable virtual
```

_Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
is empty._

### _beforeFallback

```solidity
function _beforeFallback() internal virtual
```

_Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`
call, or as part of the Solidity `fallback` or `receive` functions.

If overriden should call `super._beforeFallback()`._

