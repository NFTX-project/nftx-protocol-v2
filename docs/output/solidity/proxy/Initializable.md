# Solidity API

## Initializable

_This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
behind a proxy. Since a proxied contract can't have a constructor, it's common to move constructor logic to an
external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.

TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.

CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
that all initializers are idempotent. This is not verified automatically as constructors are by Solidity._

### _initialized

```solidity
bool _initialized
```

_Indicates that the contract has been initialized._

### _initializing

```solidity
bool _initializing
```

_Indicates that the contract is in the process of being initialized._

### initializer

```solidity
modifier initializer()
```

_Modifier to protect an initializer function from being invoked twice._

