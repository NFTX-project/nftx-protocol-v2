# Solidity API

## StakingTokenProvider

### uniLikeExchange

```solidity
address uniLikeExchange
```

### defaultPairedToken

```solidity
address defaultPairedToken
```

### defaultPrefix

```solidity
string defaultPrefix
```

### pairedToken

```solidity
mapping(address => address) pairedToken
```

### pairedPrefix

```solidity
mapping(address => string) pairedPrefix
```

### NewDefaultPaired

```solidity
event NewDefaultPaired(address oldPaired, address newPaired)
```

### NewPairedTokenForVault

```solidity
event NewPairedTokenForVault(address vaultToken, address oldPairedtoken, address newPairedToken)
```

### __StakingTokenProvider_init

```solidity
function __StakingTokenProvider_init(address _uniLikeExchange, address _defaultPairedtoken, string _defaultPrefix) public
```

### setPairedTokenForVaultToken

```solidity
function setPairedTokenForVaultToken(address _vaultToken, address _newPairedToken, string _newPrefix) external
```

### setDefaultPairedToken

```solidity
function setDefaultPairedToken(address _newDefaultPaired, string _newDefaultPrefix) external
```

### stakingTokenForVaultToken

```solidity
function stakingTokenForVaultToken(address _vaultToken) external view returns (address)
```

### nameForStakingToken

```solidity
function nameForStakingToken(address _vaultToken) external view returns (string)
```

### pairForVaultToken

```solidity
function pairForVaultToken(address _vaultToken, address _pairedToken) external view returns (address)
```

### sortTokens

```solidity
function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1)
```

### pairFor

```solidity
function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair)
```

