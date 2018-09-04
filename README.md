<img src="https://github.com/AraBlocks/docs/blob/master/ara.png" width="30" height="30" /> ara-contracts
========
![](https://travis-ci.com/AraBlocks/ara-filesystem.svg?token=93ySMW14xn3tP6eZMEza&branch=master)

Blockchain interactions in Ara modules.

## Overview

This repository contains all contracts deployed by Ara. There are four contracts used throughout the entire network: 

1. `AraToken.sol` - The Ara ERC20 token contract
2. `AFS.sol` - The `AFS` standard contract which defines the logic for `AFS` configurations and behavior on the blockchain
3. `Library.sol` - The contract where content ownership across the network is consolidated and tracked
4. `Registry.sol` - The contract where `AFS` proxies and `AFS` standards are created, linked, and tracked

In addition to these globally-used contracts, Ara deploys a proxy contract for each individual `AFS` that gets committed to the blockchain ([see `ara-filesystem`](https://github.com/AraBlocks/ara-filesystem/)). This contract serves as the storage layer for `AFS` on the blockchain, while the `AFS` standard serves as the logic layer.

This repository also provides programmatic (see the API section) and command-line interfaces (see the Usage section) for interacting with the contracts.

## Status

This project is in active development.

## Dependencies

- [Node](https://nodejs.org/en/download/)
- [Truffle](https://www.npmjs.com/package/truffle)

## Installation

TODO

## Usage

TODO CLI commands

### Ara Privatenet

The contracts in this repository are deployed on [Ara Privatenet](https://github.com/AraBlocks/ara-privatenet). You **must** be connected in order to be on the same network as the rest of the Ara team during development and to use the addresses in `constants.js`.

## API

**NOTE**: All functions are asynchronous

* [purchase(opts)](#purchase)

### Registry

* [registry.proxyExists(contentDid)](#proxyexists)
* [registry.getProxyAddress(contentDid)](#getproxy)
* [registry.upgradeProxy(opts)](#upgrade)
* [registry.deployProxy(opts)](#deploy)
* [registry.getLatestStandard()](#lateststandard)
* [registry.getStandard(version)](#getstandard)
* [registry.deployNewStandard(opts)](#newstandard)

### Library
* [library.getLibrary(requesterDid)](#getlibrary)
* [library.checkLibrary(opts)](#checklibrary)
* [library.getLibrarySize(requesterDid)](#librarysize)
* [library.getLibraryItem(opts)](#libraryitem)

### Rewards
* [rewards.submit(opts)](#submit)
* [rewards.allocate(opts)](#allocate)
* [rewards.redeem(opts)](#redeem)
* [rewards.getBudget(opts)](#budget)
* [rewards.getBalance(opts)](#balance)

### `purchase(opts)` <a name="purchase"></a>

Purchases an AFS and adds it to the requester's library.

- `opts`
  - `requesterDid` - The `DID` of the person making the purchase
  - `contentDid` - The `DID` of the content being purchased
  - `password` - The requester's password
  - `job` - optional job ID to use for the initial download

```js
const requesterDid = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const contentDid = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const job = '0x7dc039cfb220029c371d0f4aabf4a956ed0062d66c447df7b4595d7e11187271'
await purchase({
      requesterDid,
      contentDid,
      password,
      job
    })
```

### `registry.proxyExists(contentDid)` <a name="proxyexists"></a>

Checks if the proxy for a content `DID` exists.

- `contentDid` - The `DID` of the content to check

```js
const exists = await registry.proxyExists(contentDid)
```

### `registry.getProxyAddress(contentDid)` <a name="getproxy"></a>

Gets the address of a proxy given a content `DID`

- `contentDid` - The `DID` of the content

```js
const address = await registry.getProxyAddress(contentDid)
```

### `registry.upgradeProxy(opts)` <a name="upgrade"></a>

Upgrades a proxy to another `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content
  - `password` - The password of the owner of the proxy
  - `version` - The `AFS` standard version to upgrade to

```js
const upgraded = await registry.upgradeProxy({ contentDid, password, version: '1' })
```

### `registry.deployProxy(opts)` <a name="deploy"></a>

Deploys a proxy to an `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content to deploy a proxy for
  - `password` - The password of the owner of the `AFS`
  - `version` - The version to use with this proxy

```js
const address = await registry.deployProxy({ contentDid, password, version: '1' })
```

### `registry.getLatestStandard()` <a name="lateststandard"></a>

Gets the latest `AFS` contract standard.

```js
const address = await registry.getLatestStandard()
```

### `registry.getStandard(version)` <a name="getstandard"></a>

Gets an `AFS` contract standard.

- `version` - The version of the `AFS` contract standard

```js
const address = await registry.getStandard('1')
```

### `registry.deployNewStandard(opts)` <a name="newstandard"></a>

Compiles and deploys a new `AFS` standard.

- `opts`
  - `requesterDid` - The `DID` of the person deploying the standard
  - `password` - The password of the person deploying the standard
  - `version` - The version of the standard
  - `paths` - The solidity dependencies of the standard

```js
const version = '1'
const paths = ['./contracts/AFS.sol',
               './contracts/Library.sol',
               './contracts/Registry.sol',
               './contracts/Proxy.sol',
               './contracts/ARAToken.sol',
               './contracts/Jobs.sol']
const address = await registry.deployNewStandard({
  requesterDid,
  password,
  version,
  paths
})
```

### `library.getLibrary(requesterDid)` <a name="getlibrary"></a>

Gets the content `DID`s purchased by the `requesterDID`.

- `requesterDid` - The `DID` of the owner of the library

```js
const lib = await library.getLibrary(did)
```

### `library.checkLibrary(opts)` <a name="checklibrary"></a>

Checks to see if `contentDid` is in the `requesterDid`'s library.

- `opts`
  - `requesterDid` - The `DID` of the owner of the library
  - `contentDid` - The `DID` of the content to check

```js
try { 
  const lib = await library.checkLibrary({ requesterDid, contentDid })
} catch (err) {
  throw err // Item is already in user library and cannot be purchased again
}
```


### `library.getLibrarySize(requesterDid)` <a name="librarysize"></a>

Gets the size of `requesterDid`'s library.

- `requesterDid` - The `DID` of the owner of the library

```js
const size = await library.getLibrarySize(did)
```

### `library.getLibraryItem(opts)` <a name="libraryitem"></a>

Gets the `DID` of the item at the provided `index` in `requesterDid`'s library.

- `opts`
  - `requesterDid` - The `DID` of the owner of the library
  - `index` - The index of the content to retrieve

```js
const contentDid = await library.getLibraryItem({ requesterDid, index: 1 })
```

### `rewards.submit(opts)` <a name="submit"></a>

Submits new DCDN job.

- `opts`
  - `requesterDid` - The `DID` of the person submitting the job
  - `contentDid` - The `DID` of the content this job is for
  - `password` - The password of the person submitting the job
  - `job`
    - `jobId` - The `jobId` of the job being submitted
    - `budget` - The budget to allocate for the job

```js
const jobId = '0x7dc039cfb220029c371d0f4aabf4a956ed0062d66c447df7b4595d7e11187271'
const budget = 10
await rewards.submit({ 
  requesterDid,
  contentDid,
  password,
  job: {
    jobId,
    budget
  }
})
```

### `rewards.allocate(opts)` <a name="allocate"></a>

Allocates `rewards` amongst `farmers` for `jobId`.

- `opts`
  - `requesterDid` - The `DID` of the person who submitted the job
  - `contentDid` - The `DID` of the content the job is for
  - `password` - The password of the person who submitted the job
  - `job`
    - `jobId` - The `jobId` of the job to allocate for
    - `farmers` - The Ethereum addresses of the farmers to reward
    - `rewards` - The reward amounts in Ara tokens to split amongst `farmers`, respectively

```js
const jobId = '0x7dc039cfb220029c371d0f4aabf4a956ed0062d66c447df7b4595d7e11187271'
const farmers = ['0xF9403C6DA32DB4860F1eCB1c02B9A04D37c0e36e',
                 '0x70693d8f4e1c9bA1AE0870C35128BaDfDcF28FBc',
                 '0x19d6a7D8bB09e8A6d733a9c8D9fe7b964fD8F45e',
                 '0x629483C72b5191C1b522E887238a0A522b1D4F74']
const distribution = [10, 20, 30, 40]
await rewards.allocate({
  requesterDid,
  contentDid,
  password,
  job: {
    jobId,
    farmers,
    rewards: distribution
  }
})
```

### `rewards.redeem(opts)` <a name="redeem"></a>

Redeem Ara tokens (resulting from allocation return or from rewards) from AFS contract.

- `opts`
  - `requesterDid` - The `DID` of the person redeeming tokens
  - `contentDid` - The `DID` of the content to redeem from
  - `password` - The password of the person redeeming tokens

```js
const balance = await rewards.redeem({
  requesterDid,
  contentDid,
  password
})
```

### `rewards.getBudget(opts)` <a name="budget"><a/>

Gets the budget for `jobId`.

- `opts`
  - `contentDid` - The `DID` of the content that has `jobId`
  - `jobId` - The `jobId` of the job to get the budget for

```js
const budget = await rewards.getBudget({
  contentDid,
  jobId
})
```

### `rewards.getBalance(opts)` <a name="balance"></a>

Gets the balance (resulting from allocation return or from rewards) of `requesterDid` stored in `contentDid`.

- `opts`
  - `requesterDid` - The `DID` of the person to check the balance of
  - `contentDid` - The `DID` of the content where the balance is stored
  - `password` - The password of the person to check the balance of

```js
const balance = await rewards.getBalance({
  requesterDid,
  contentDid,
  password
})
```

## Contributing
- [Commit message format](/.github/COMMIT_FORMAT.md)
- [Commit message examples](/.github/COMMIT_FORMAT_EXAMPLES.md)
- [How to contribute](/.github/CONTRIBUTING.md)

Releases follow [Semantic Versioning](https://semver.org/)

## See Also

- [Truffle](https://github.com/trufflesuite/truffle)
- [ARA Filesystem](https://github.com/AraBlocks/ara-filesystem)
- [ARA Identity](https://github.com/AraBlocks/ara-identity)

## License
LGPL-3.0
