<img src="https://github.com/AraBlocks/docs/blob/master/ara.png" width="30" height="30" /> ara-contracts
========

[![Build Status](https://travis-ci.com/AraBlocks/ara-contracts.svg?token=93ySMW14xn3tP6eZMEza&branch=master)](https://travis-ci.com/AraBlocks/ara-contracts)

Blockchain interactions in Ara modules.

## Overview

This repository contains all contracts deployed by Ara. There are four contracts used throughout the entire network: 

1. `AraToken.sol` - The Ara ERC20 token contract
2. `AFS.sol` - The `AFS` standard contract which defines the logic for `AFS` configurations and behavior on the blockchain (see the accompanying [RFC](https://github.com/AraBlocks/RFCs/blob/master/text/0004-afs-contract-standard.md))
3. `Library.sol` - The contract where content ownership across the network is consolidated and tracked
4. `Registry.sol` - The contract where `AFS` proxies and `AFS` standards are created, linked, and tracked

In addition to these globally-used contracts, Ara deploys a proxy contract for each individual `AFS` that gets committed to the blockchain ([see `ara-filesystem`](https://github.com/AraBlocks/ara-filesystem/)). This contract serves as the storage layer for `AFS` on the blockchain, while the `AFS` standard serves as the logic layer.

This repository also provides programmatic (see the API section) and command-line interfaces (see the Usage section) for interacting with the contracts.

## Status

This project is in active development.

## Stability

> [Stability][stability-index]: 2 - Stable. 
> Compatibility with the npm ecosystem is a high priority.

## Dependencies

- [Node](https://nodejs.org/en/download/)
- [Truffle](https://www.npmjs.com/package/truffle)

## Installation

```bash
$ npm install arablocks/ara-contracts --save
```

## Usage

TODO CLI commands

### Ara Privatenet

The contracts in this repository are deployed on [Ara Privatenet](https://github.com/AraBlocks/ara-privatenet). You **must** be connected in order to be on the same network as the rest of the Ara team during development and to use the addresses in `constants.js`.

## API

> All functions are asynchronous.
> Any value inputted into token functions must be strings to avoid precision errors

* [purchase(opts)](#purchase)

### Registry

* [registry.getProxyAddress(contentDid)](#getproxy)
* [registry.upgradeProxy(opts)](#upgrade)
* [registry.deployProxy(opts)](#deploy)
* [registry.getLatestStandard()](#lateststandard)
* [registry.getStandard(version)](#getstandard)
* [registry.deployNewStandard(opts)](#newstandard)

### Library
* [library.getLibrary(requesterDid)](#getlibrary)
* [library.getLibrarySize(requesterDid)](#librarysize)
* [library.getLibraryItem(opts)](#libraryitem)
* [library.hasPurchased(opts)](#haspurchased)

### Rewards
* [rewards.submit(opts)](#submit)
* [rewards.allocate(opts)](#allocate)
* [rewards.redeem(opts)](#redeem)
* [rewards.getBudget(opts)](#budget)
* [rewards.getRewardsBalance(opts)](#balance)

### Token

* [token.balanceOf(did)](#balanceof)
* [token.totalSupply()](#totalsupply)
* [token.allowance(opts)](#allowance)
* [token.transfer(opts)](#transfer)
* [token.approve(opts)](#approve)
* [token.transferFrom(opts)](#transferfrom)
* [token.increaseApproval(opts)](#increaseapproval)
* [token.decreaseApproval(opts)](#decreaseapproval)
* [token.modifyDeposit(opts)](#modifydeposit)
* [token.getAmountDeposited(did)](#getamountdeposited)

<a name="purchase"></a>
### `purchase(opts)`

Purchases an `AFS` and adds it to the requester's library.

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

<a name="getproxy"></a>
### `registry.getProxyAddress(contentDid)`

Gets the address of a proxy given a content `DID`

- `contentDid` - The `DID` of the content

```js
const address = await registry.getProxyAddress(contentDid)
```

<a name="upgrade"></a>
### `registry.upgradeProxy(opts)`

Upgrades a proxy to another `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content
  - `password` - The password of the owner of the proxy
  - `version` - The `AFS` standard version to upgrade to

```js
const upgraded = await registry.upgradeProxy({ contentDid, password, version: '1' })
```

<a name="deploy"></a>
### `registry.deployProxy(opts)`

Deploys a proxy to an `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content to deploy a proxy for
  - `password` - The password of the owner of the `AFS`
  - `version` - The version to use with this proxy

```js
const address = await registry.deployProxy({ contentDid, password, version: '1' })
```

<a name="lateststandard"></a>
### `registry.getLatestStandard()`

Gets the latest `AFS` contract standard.

```js
const address = await registry.getLatestStandard()
```

<a name="getstandard"></a>
### `registry.getStandard(version)`

Gets an `AFS` contract standard.

- `version` - The version of the `AFS` contract standard

```js
const address = await registry.getStandard('1')
```

<a name="newstandard"></a>
### `registry.deployNewStandard(opts)`

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
               './contracts/AraToken.sol',
               './contracts/Jobs.sol']
const address = await registry.deployNewStandard({
  requesterDid,
  password,
  version,
  paths
})
```

<a name="getlibrary"></a>
### `library.getLibrary(requesterDid)`

Gets the content `DID`s purchased by the `requesterDID`.

- `requesterDid` - The `DID` of the owner of the library

```js
const lib = await library.getLibrary(did)
```

<a name="librarysize"></a>
### `library.getLibrarySize(requesterDid)`

Gets the size of `requesterDid`'s library.

- `requesterDid` - The `DID` of the owner of the library

```js
const size = await library.getLibrarySize(did)
```

<a name="libraryitem"></a>
### `library.getLibraryItem(opts)`

Gets the `DID` of the item at the provided `index` in `requesterDid`'s library.

- `opts`
  - `requesterDid` - The `DID` of the owner of the library
  - `index` - The index of the content to retrieve

```js
const contentDid = await library.getLibraryItem({ requesterDid, index: 1 })
```

<a name="haspurchased"></a>
### `library.hasPurchased(opts)`

- `opts`
  - `contentDid` - `DID` of the content to check the purchase of
  - `purchaserDid` - `DID` of purchaser

```js
const purchased = await token.hasPurchased({
  contentDid: 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85',
  purchaserDid: 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
})
```

<a name="submit"></a>
### `rewards.submit(opts)`

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

<a name="allocate"></a>
### `rewards.allocate(opts)`

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

<a name="redeem"></a>
### `rewards.redeem(opts)`

Redeem Ara tokens (resulting from allocation return or from rewards) from `AFS` contract.

- `opts`
  - `farmerDid` - The `DID` of the person redeeming tokens
  - `contentDid` - The `DID` of the content to redeem from
  - `password` - The password of the person redeeming tokens

```js
const balance = await rewards.redeem({
  farmerDid,
  contentDid,
  password
})
```

<a name="budget"><a/>
### `rewards.getBudget(opts)`

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

<a name="balance"></a>
### `rewards.getRewardsBalance(opts)`

Gets the balance (resulting from allocation return or from rewards) of `farmerDid` stored in `contentDid`.

- `opts`
  - `farmerDid` - The `DID` of the person to check the balance of
  - `contentDid` - The `DID` of the content where the balance is stored
  - `password` - The password of the person to check the balance of

```js
const balance = await rewards.getRewardsBalance({
  farmerDid,
  contentDid,
  password
})
```

<a name="balanceof"></a>
### `token.balanceOf(did)`

Queries for the balance in Ara of an identity.

- `did` - The `DID` of the account to get the balance for

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const balance = await token.balanceOf(did) // 100.5
```

<a name="totalsupply"></a>
### `token.totalSupply()`

Gets the total circulating supply of Ara tokens.

```js
const supply = await token.totalSupply() // 1000000000
```

<a name="allowance"></a>
### `token.allowance(opts)`

Gets the amount in Ara that a `spender` is allowed to spend of an `owner`.

- `owner` - `DID` of the owner of the Ara tokens to be spent
- `spender` - `DID` of the account that will be spending `owner`'s tokens

```js
const owner = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const allowance = await token.allowance({ owner, spender })
```

<a name="transfer"></a>
### `token.transfer(opts)`

Transfers Ara from one account to another.

- `opts`
  - `did` - URI of the account that is sending the Ara
  - `password` - Password of the account sending Ara
  - `to` - `DID` of the account to receive the tokens
  - `val` - Amount to transfer

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const recipient = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const receipt = await token.transfer({
  did,
  password,
  to: recipient,
  val: '500'
})
```

<a name="approve"></a>
### `token.approve(opts)`

Sets the approved token amount to be spent on an owner's behalf. This will overwrite any previous approvals.

- `opts`
  - `did` - URI of the account that owns the Ara
  - `password` - Password of the owning account
  - `spender` - `DID` of the account that will be spending the tokens
  - `val` - Amount to approve
  
```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const recipient = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const receipt = await token.approve({
  did,
  password,
  spender,
  val: '500'
})
```

<a name="transferfrom"></a>
### `token.transferFrom(opts)`

Transfers Ara from one address to another. This differs from `transfer` by requiring the tokens to be first approved to be spent.

- `opts`
  - `did` - URI of the account that owns the Ara
  - `password` - Password of the owning account
  - `to` - `DID` if the account that will be receiving the tokens
  - `val` - Amount to transfer

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const recipient = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const receipt = await token.transferFrom({
  did,
  password,
  to: recipient,
  val: '500'
})
```

<a name="increaseapproval"></a>
### `token.increaseApproval(opts)`

Increases the approved amount that a `spender` can spend on behalf of an `owner`. This will not overwrite any existing approved amount, just increase it.

- `opts`
  - `did` - URI of the account that owns the Ara
  - `password` - Password of the owning account
  - `to` - `DID` of the spender
  - `val` - Amount to increase the approval by

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const receipt = await token.increaseApproval({
  did,
  password,
  spender,
  val: '10'
})
```

<a name="decreaseapproval"></a>
### `token.decreaseApproval(opts)`

Decreases the approved amount that a `spender` can spend on behalf of an `owner`. This will not overwrite any existing approved amount, just decrease it.

- `opts`
  - `did` - URI of the account that owns the Ara
  - `password` - Password of the owning account
  - `to` - `DID` of the spender
  - `val` - Amount to decrease the approval by

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const receipt = await token.decreaseApproval({
  did,
  password,
  spender,
  val: '10'
})
```

<a name="modifydeposit"></a>
### `token.modifyDeposit(opts)`

Modifies the current amount deposited for rewards for a particular account.

- `opts`
  - `did` - URI of the account to update the deposit for
  - `password` - password of the account
  - `val` - value as `string` to deposit/withdraw
  - `withdraw` - `boolean` whether this should be a deposit or withdraw (defaults to `false` if not given)

```js
// withdraws 50 Ara from deposit
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const receipt = await token.modifyDeposit({
  did,
  password,
  val: '50',
  withdraw: true
})

// deposits 50 Ara
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const receipt = await token.modifyDeposit({
  did,
  password,
  val: '50'
})
```

<a name="getamountdeposited"></a>
### `token.getAmountDeposited(did)`

Gets the current amount deposited by an account to be used for redeeming rewards.

- `did` - URI of the account to get the deposit balance for

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const amount = await token.getAmountDeposited(did) // '100'
```

## Contributing
- [Commit message format](/.github/COMMIT_FORMAT.md)
- [Commit message examples](/.github/COMMIT_FORMAT_EXAMPLES.md)
- [How to contribute](/.github/CONTRIBUTING.md)

Releases follow [Semantic Versioning](https://semver.org/)

## See Also

- [Truffle](https://github.com/trufflesuite/truffle)
- [Ara Filesystem](https://github.com/AraBlocks/ara-filesystem)
- [Ara Identity](https://github.com/AraBlocks/ara-identity)
- [Stability index][stability-index]

## License
LGPL-3.0

[stability-index]: https://nodejs.org/api/documentation.html#documentation_stability_index
