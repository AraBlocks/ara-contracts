<img src="https://github.com/AraBlocks/docs/blob/master/ara.png" width="30" height="30" /> ara-contracts
========

[![Build Status](https://travis-ci.com/AraBlocks/ara-contracts.svg?token=93ySMW14xn3tP6eZMEza&branch=master)](https://travis-ci.com/AraBlocks/ara-contracts)

Blockchain interactions in Ara modules.

## Overview

This repository contains all contracts deployed by Ara. There are five global contracts used throughout the entire network:

1. `AraToken.sol` - The Ara ERC20 token contract

| Network | Type           | Address                                      | Verified Source                                                                      |
| ------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ropsten | Proxy          | `0x06be7386f99c38d26d53d83cbf1b9f438930694b` | https://ropsten.etherscan.io/address/0x06be7386f99c38d26d53d83cbf1b9f438930694b#code |
| Ropsten | Implementation | `0xc349b831e83248368aa69c42fa717f700fecb8ce` | https://ropsten.etherscan.io/address/0xc349b831e83248368aa69c42fa717f700fecb8ce#code |
| Mainnet | Proxy          | `0xa92e7c82b11d10716ab534051b271d2f6aef7df5` | https://etherscan.io/address/0xa92e7c82b11d10716ab534051b271d2f6aef7df5#code         |
| Mainnet | Implementation | `0xb8ca408aff631b65021850cd7ebf8eac7f3c0312` | https://etherscan.io/address/0xb8ca408aff631b65021850cd7ebf8eac7f3c0312#code         |

2. `AFS.sol` - The `AFS` standard contract defines the API for interacting with `AFS`s on the blockchain (see the accompanying [RFC](https://github.com/AraBlocks/RFCs/blob/master/text/0004-afs-contract-standard.md)). The current `AFS Standard` version is `4`. Future Standards are not necessarily sequential or superseding in nature and may exist in parallel (e.g., another `AFS Standard` may be named `ecommerce` which can be used for an entirely different class of `AFS`s). In order to estimate costs for interacting with the Standard without needing to deploy a proxy beforehand, we additionally deploy a version of all `AFS Standard`s without `modifiers` which are named `${version name}_estimate`. The current `AFS Estimate Standard` version is `4_estimate`.

| Network | Version      | Address                                      | Verified Source                                                                      |
| ------- | ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ropsten | `6`          | `0x54a206a07e18a1fed118e3f946db4e3b7de35049` | https://ropsten.etherscan.io/address/0x54a206a07e18a1fed118e3f946db4e3b7de35049#code |
| Ropsten | `6_estimate` | `0x5437dF777Fa849dadD67A7F7fD88F9deB657166A` | https://ropsten.etherscan.io/address/0x5437df777fa849dadd67a7f7fd88f9deb657166a#code |
| Mainnet | `2`          | `0x7bd36ca16161d8290986d4dca8265c2b5ca340fe` | https://etherscan.io/address/0x7bd36ca16161d8290986d4dca8265c2b5ca340fe#code |
| Mainnet | `2_estimate` | `0x39798776e91874583abf1e36c77a49446a8f3cea` | https://etherscan.io/address/0x39798776e91874583abf1e36c77a49446a8f3cea#code |

3. `Library.sol` - The contract where content ownership across the network is consolidated and tracked

| Network | Type           | Address                                      | Verified Source                                                                      |
| ------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ropsten | Proxy          | `0xec26659b209e9e89a23d26298ba0359b1b6c7f76` | https://ropsten.etherscan.io/address/0xec26659b209e9e89a23d26298ba0359b1b6c7f76#code |
| Ropsten | Implementation | `0x991198dac7e5aa586ed129735e142c01ad81ed69` | https://ropsten.etherscan.io/address/0x991198dac7e5aa586ed129735e142c01ad81ed69#code |
| Mainnet | Proxy          | `0xC04B27294bb3d1abaAC39F2F97B4A95810bA91dd` | https://etherscan.io/address/0xc04b27294bb3d1abaac39f2f97b4a95810ba91dd#code |
| Mainnet | Implementation | `0x991198dac7e5aa586ed129735e142c01ad81ed69` | https://etherscan.io/address/0xfdb1b5adf9cc13d8434f3d493f345a8bc46afcdc#code |

4. `Registry.sol` - The contract where `AFS` proxies and `AFS` standards are created, linked, and tracked

| Network | Type           | Address                                      | Verified Source                                                                      |
| ------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ropsten | Proxy          | `0xdb8f8d6cc69a346d608e64c2ddb5b3ed7e4b32d6` | https://ropsten.etherscan.io/address/0xdb8f8d6cc69a346d608e64c2ddb5b3ed7e4b32d6#code |
| Ropsten | Implementation | `0xbbc4d435c7426cef12c4b6d4d12552a1e7de24ef` | https://ropsten.etherscan.io/address/0xbbc4d435c7426cef12c4b6d4d12552a1e7de24ef#code |
| Mainnet | Proxy          | `0x17a6033535b1ab8cbbb430c62782d164d8f6ac45` | https://etherscan.io/address/0x17a6033535b1ab8cbbb430c62782d164d8f6ac45#code |
| Mainnet | Implementation | `0x814F2ca790454c795F5e515A394CbFB7bE499737` | https://etherscan.io/address/0x814f2ca790454c795f5e515a394cbfb7be499737#code |

5. `AraRegistry.sol` - The contract used to deploy the Library, Registry, and AraToken contracts

| Network | Type           | Address                                      | Verified Source                                                                      |
| ------- | -------------- | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Ropsten | Implementation | `0x6bda4b9fcb082e72b30081393d4ae7b05360e517` | https://ropsten.etherscan.io/address/0x6bda4b9fcb082e72b30081393d4ae7b05360e517#code |
| Mainnet | Implementation | `0xf8314584346fc84e96b36113784f6b562e5b01af` | https://etherscan.io/address/0xf8314584346fc84e96b36113784f6b562e5b01af#code         |

This repository also provides programmatic (see the API section) and command-line interfaces (see the Usage section) for interacting with the contracts.

## AFS Proxies
In addition to these global contracts, Ara deploys a proxy contract for each individual `AFS` that gets committed to the blockchain (see [`ara-filesystem`](https://github.com/AraBlocks/ara-filesystem/) and [proxy architecture](https://blog.zeppelinos.org/proxy-patterns/)). This contract serves as the storage layer for `AFS`s on the blockchain, while the `AFS Standard` serves as the API (business logic layer) for interacting with `AFS`s on the blockchain.

## Stability

> [Stability][stability-index]: 2 - Stable.
> Compatibility with the npm ecosystem is a high priority.

Although the API is stable, this project is still in alpha development and is not yet ready to be used in a production environment.

## Dependencies

- [Node](https://nodejs.org/en/download/)
- [Truffle](https://www.npmjs.com/package/truffle)

## Installation

```bash
$ npm install arablocks/ara-contracts --save
```

## Usage

See CLI Usage docs [here](https://github.com/AraBlocks/ara-contracts/blob/master/docs/CLI-README.md).

### Ara Privatenet

The contracts in this repository are currently deployed on [Ara Privatenet](https://github.com/AraBlocks/ara-privatenet) and [Ethereum Ropsten Testnet](https://github.com/AraBlocks/ara-privatenet/blob/master/TESTNET.md). You **must** be connected to one of these networks in order to be on the same network as the rest of the Ara team during development and to use the addresses in `constants.js`. You may run a local [Ganache](https://truffleframework.com/ganache) instance for local development.

## API

> Any value inputted into token functions must be strings to avoid precision error
> All transaction callbacks (`onhash`, `onreceipt`, `onconfirmation`, `onerror`, and `onmined`) are optional. For more information, see [`ara-util`](https://github.com/AraBlocks/ara-util#sendSignedTransaction).

### Purchase

* [purchase(opts)](#purchaseopts)

### Registry

* [async registry.proxyExists(contentDid)](#proxyexists)
* [async registry.getProxyAddress(contentDid)](#getproxy)
* [async registry.upgradeProxy(opts)](#upgrade)
* [async registry.deployProxy(opts)](#deploy)
* [async registry.getProxyVersion(contentDid)](#proxyversion)
* [async registry.getLatestStandard()](#lateststandard)
* [async registry.getStandard(version)](#getstandard)
* [async registry.deployNewStandard(opts)](#newstandard)

### Library

* [async library.getLibrary(requesterDid)](#getlibrary)
* [async library.getLibrarySize(requesterDid)](#librarysize)
* [async library.getLibraryItem(opts)](#libraryitem)
* [async library.hasPurchased(opts)](#haspurchased)

### Rewards

* [async rewards.submit(opts)](#submit)
* [async rewards.allocate(opts)](#allocate)
* [async rewards.redeem(opts)](#redeem)
* [async rewards.getBudget(opts)](#budget)
* [async rewards.getJobOwner(opts)](#jobowner)
* [async rewards.getRewardsBalance(opts)](#balance)

### Token

* [async token.balanceOf(did, keyringOpts)](#balanceof)
* [async token.totalSupply()](#totalsupply)
* [async token.allowance(opts)](#allowance)
* [async token.transfer(opts)](#transfer)
* [async token.approve(opts)](#approve)
* [async token.transferFrom(opts)](#transferfrom)
* [async token.increaseApproval(opts)](#increaseapproval)
* [async token.decreaseApproval(opts)](#decreaseapproval)
* [async token.modifyDeposit(opts)](#modifydeposit)
* [async token.getAmountDeposited(did, keyringOpts)](#getamountdeposited)
* [token.constrainTokenValue(val)](#constrain)
* [token.expandTokenValue(val)](#expand)

### Ownership

* [async ownership.approveOwnershipTransfer(opts)](#approveownership)
* [async ownership.revokeOwnershipRequest(opts)](#revokeownership)
* [async ownership.requestOwnership(opts)](#requestownership)
* [async ownership.hasRequested(opts)](#hasrequested)
* [async ownership.getOwner(contentDid)](#getowner)


<a name="purchaseopts"></a>
### `async purchase(opts)`

Purchases an `AFS` and adds it to the requester's library.

- `opts`
  - `requesterDid` - The `DID` of the person making the purchase
  - `contentDid` - The `DID` of the content being purchased
  - `password` - The requester's password
  - `budget` - The budget in Ara to allocate for the initial download job
  - `gasPrice` - Optional gas price in GWei
  - `approve` - Optional boolean indicating whether to send the Approve transaction prior to the Purchase transaction
  - `keyringOpts` - Optional keyring options
  - `approveCallbacks` - Optional callbacks for the Approve transaction
    - `onhash`
    - `onreceipt`
    - `onconfirmation`
    - `onerror`
    - `onmined`
  - `purchaseCallbacks` - Optional callbacks for the Purchase transaction
    - `onhash`
    - `onreceipt`
    - `onconfirmation`
    - `onerror`
    - `onmined`

Returns `object`:
  - `receipt` - Transaction receipt
  - `jobId` - The job ID generated for the initial download

```js
const requesterDid = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const contentDid = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const budget = 100
const { receipt, jobId } = await purchase({
  requesterDid,
  contentDid,
  password,
  budget
})
```

<a name="proxyexists"></a>
### `async registry.proxyExists(contentDid)`

Checks if the proxy for a content `DID` exists.

- `contentDid` - The `DID` of the content to check

Returns a `boolean` indicating whether a proxy contract exists for a `contentDid`.

```js
const exists = await registry.proxyExists(contentDid)
```

<a name="getproxy"></a>
### `async registry.getProxyAddress(contentDid)`

Gets the address of a proxy given a content `DID`

- `contentDid` - The `DID` of the content

```js
const address = await registry.getProxyAddress(contentDid)
```

<a name="upgrade"></a>
### `async registry.upgradeProxy(opts)`

Upgrades a proxy to another `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content
  - `password` - The password of the owner of the proxy
  - `afsPassword` - The password of the AFS
  - `version` - The `AFS` standard version to upgrade to
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns a `boolean` indicating whether the proxy was successfully upgraded.

```js
const upgraded = await registry.upgradeProxy({ contentDid, password, afsPassword, version: '1' })
```

<a name="deploy"></a>
### `async registry.deployProxy(opts)`

Deploys a proxy to an `AFS` standard.

- `opts`
  - `contentDid` - The `DID` of the content to deploy a proxy for
  - `password` - The password of the owner of the `AFS`
  - `afsPassword` - The password of the AFS
  - `version` - The version to use with this proxy
  - `estimate` - Optional flag to check cost of `deployProxy`
  - `ownerDid` - Optional owner `DID` used in conjunction with `estimate` to bypass needing a real AFS
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns the address at which the proxy was deployed.

```js
const address = await registry.deployProxy({ contentDid, password, afsPassword, version: '1' })
```

<a name="proxyversion"></a>
### `async registry.getProxyVersion(contentDid)`

Gets the `AFS` Standard version a proxy is using.

- `contentDid` - The `DID` of the content

```js
const version = await registry.getProxyVersion(contentDid)
```

<a name="lateststandard"></a>
### `async registry.getLatestStandard()`

Gets the latest `AFS` contract standard.

```js
const address = await registry.getLatestStandard()
```

<a name="getstandard"></a>
### `async registry.getStandard(version)`

Gets the address of an `AFS` contract standard.

- `version` - The version of the `AFS` contract standard

```js
const address = await registry.getStandard('1')
```

<a name="newstandard"></a>
### `async registry.deployNewStandard(opts)`

Compiles and deploys a new `AFS` standard.

- `opts`
  - `requesterDid` - The `DID` of the person deploying the standard
  - `password` - The password of the person deploying the standard
  - `version` - The version of the standard
  - `paths` - The solidity dependencies of the standard
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns the address at which the standard was deployed.

```js
const version = '1'
const paths = ['./contracts/ignored_contracts/AFS.sol',
               './contracts/ignored_contracts/Library.sol',
               './contracts/ignored_contracts/Registry.sol',
               './contracts/AraProxy.sol',
               './contracts/ignored_contracts/AraToken.sol']
const address = await registry.deployNewStandard({
  requesterDid,
  password,
  version,
  paths
})
```

<a name="getlibrary"></a>
### `async library.getLibrary(requesterDid)`

Gets the content `DID`s purchased by the `requesterDID`.

- `requesterDid` - The `DID` of the owner of the library

```js
const lib = await library.getLibrary(did)
```

<a name="librarysize"></a>
### `async library.getLibrarySize(requesterDid)`

Gets the size of `requesterDid`'s library.

- `requesterDid` - The `DID` of the owner of the library

```js
const size = await library.getLibrarySize(did)
```

<a name="libraryitem"></a>
### `async library.getLibraryItem(opts)`

Gets the `DID` of the item at the provided `index` in `requesterDid`'s library.

- `opts`
  - `requesterDid` - The `DID` of the owner of the library
  - `index` - The index of the content to retrieve

```js
const contentDid = await library.getLibraryItem({ requesterDid, index: 1 })
```

<a name="haspurchased"></a>
### `async library.hasPurchased(opts)`

- `opts`
  - `contentDid` - `DID` of the content to check the purchase of
  - `purchaserDid` - `DID` of purchaser
  - `keyringOpts` - optional Keyring options

```js
const purchased = await library.hasPurchased({
  contentDid: 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85',
  purchaserDid: 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
})
```

<a name="submit"></a>
### `async rewards.submit(opts)`

Submits new DCDN job.

- `opts`
  - `requesterDid` - The `DID` of the person submitting the job
  - `contentDid` - The `DID` of the content this job is for
  - `password` - The password of the person submitting the job
  - `job`
    - `jobId` - The `jobId` of the job being submitted
    - `budget` - The budget to allocate for the job
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const jobId = '0x7dc039cfb220029c371d0f4aabf4a956ed0062d66c447df7b4595d7e11187271'
const budget = 10
const receipt = await rewards.submit({
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
### `async rewards.allocate(opts)`

Allocates `rewards` amongst `farmers` for `jobId`.

- `opts`
  - `requesterDid` - The `DID` of the person who submitted the job
  - `contentDid` - The `DID` of the content the job is for
  - `password` - The password of the person who submitted the job
  - `job`
    - `jobId` - The `jobId` of the job to allocate for
    - `farmers` - The Ethereum addresses of the farmers to reward
    - `rewards` - The reward amounts in Ara tokens to split amongst `farmers`, respectively
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

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
### `async rewards.redeem(opts)`

Redeem Ara tokens (resulting from allocation return or from rewards) from `AFS` contract.

- `opts`
  - `farmerDid` - The `DID` of the person redeeming tokens
  - `contentDid` - The `DID` of the content to redeem from
  - `password` - The password of the person redeeming tokens
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns the number of Ara tokens redeemed.

```js
const balance = await rewards.redeem({
  farmerDid,
  contentDid,
  password
})
```

<a name="budget"><a/>
### `async rewards.getBudget(opts)`

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

<a name="jobowner"></a>
### `async rewards.getJobOwner(opts)`

Gets the address of the owner of a `jobId`.

- `opts`
  - `contentDid` - The `DID` of the content that has `jobId`
  - `jobId` - The `jobId` of the job to get the owner for

```js
const owner = await rewards.getJobOwner({
  contentDid,
  jobId
})
```

<a name="balance"></a>
### `async rewards.getRewardsBalance(opts)`

Gets the balance (resulting from allocation return or from rewards) of `farmerDid` stored in `contentDid`.

- `opts`
  - `farmerDid` - The `DID` of the person to check the balance of
  - `contentDid` - The `DID` of the content where the balance is stored
  - `password` - The password of the person to check the balance of
  - `keyringOpts` - optional Keyring options

```js
const balance = await rewards.getRewardsBalance({
  farmerDid,
  contentDid,
  password
})
```

<a name="balanceof"></a>
### `async token.balanceOf(did, keyringOpts)`

Queries for the balance in Ara of an identity.

- `did` - The `DID` of the account to get the balance for
- `keyringOpts` - optional Keyring options

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const balance = await token.balanceOf(did) // 100.5
```

<a name="totalsupply"></a>
### `async token.totalSupply()`

Gets the total circulating supply of Ara tokens.

```js
const supply = await token.totalSupply() // 1000000000
```

<a name="allowance"></a>
### `async token.allowance(opts)`

Gets the amount in Ara that a `spender` is allowed to spend of an `owner`.

- `owner` - `DID` of the owner of the Ara tokens to be spent
- `spender` - `DID` of the account that will be spending `owner`'s tokens

```js
const owner = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const allowance = await token.allowance({ owner, spender })
```

<a name="transfer"></a>
### `async token.transfer(opts)`

Transfers Ara from one account to another.

- `opts`
  - `did` - `DID` of the account that is sending the Ara
  - `password` - Password of the account sending Ara
  - `to` - `DID` of the account to receive the tokens
  - `val` - Amount to transfer
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

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
### `async token.approve(opts)`

Sets the approved token amount to be spent on an owner's behalf. This will overwrite any previous approvals.

- `opts`
  - `did` - `DID` of the account that owns the Ara
  - `password` - Password of the owning account
  - `spender` - `DID` of the account that will be spending the tokens
  - `val` - Amount to approve
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

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
### `async token.transferFrom(opts)`

Transfers Ara from one address to another. This differs from `transfer` by requiring the tokens to be first approved to be spent.

- `opts`
  - `from` - The `DID` of the origin account of the Ara tokens to transfer (this account must approve `did` to perform the transfer beforehand)
  - `to` - `DID` of the account that will be receiving the tokens
  - `val` - Amount of Ara to transfer
  - `did` - `DID` of the account initiating the transfer on behalf of `from`
  - `password` - Password of the account initiating the transfer
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const origin = 'did:ara:08228219008e3c7ab8b7f23a161c196be44ff33525ebea01d841b707b34b7adc'
const recipient = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'

const receipt = await token.transferFrom({
  from: origin,
  to: recipient,
  val: '500',
  did,
  password,
})
```

<a name="increaseapproval"></a>
### `async token.increaseApproval(opts)`

Increases the approved amount that a `spender` can spend on behalf of an `owner`. This will not overwrite any existing approved amount, just increase it.

- `opts`
  - `spender` - `DID` of the spender
  - `did` - `DID` of the account that owns the Ara
  - `password` - Password of the owning account
  - `val` - Amount to increase the approval by
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'

const receipt = await token.increaseApproval({
  spender,
  did,
  password,
  val: '10'
})
```

<a name="decreaseapproval"></a>
### `async token.decreaseApproval(opts)`

Decreases the approved amount that a `spender` can spend on behalf of an `owner`. This will not overwrite any existing approved amount, just decrease it.

- `opts`
  - `spender` - `DID` of the spender
  - `did` - `DID` of the account that owns the Ara
  - `password` - Password of the owning account
  - `val` - Amount to decrease the approval by
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'
const spender = 'did:ara:114045f3883a21735188bb02de024a4e1451cb96c5dcc80bdfa1b801ecf81b85'

const receipt = await token.decreaseApproval({
  spender,
  did,
  password,
  val: '10'
})
```

<a name="modifydeposit"></a>
### `async token.modifyDeposit(opts)`

Modifies the current amount deposited for rewards for a particular account.

- `opts`
  - `did` - `DID` of the account to update the deposit for
  - `password` - password of the account
  - `val` - value as `string` to deposit/withdraw
  - `withdraw` - `boolean` whether this should be a deposit or withdraw (defaults to `false` if not given)
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
// deposits 50 Ara
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'

const receipt = await token.modifyDeposit({
  did,
  password,
  val: '50'
})

// withdraws 50 Ara from deposit
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const password = 'password'

const receipt = await token.modifyDeposit({
  did,
  password,
  val: '50',
  withdraw: true
})
```

<a name="getamountdeposited"></a>
### `async token.getAmountDeposited(did)`

Gets the current amount deposited by an account to be used for redeeming rewards.

- `did` - `DID` of the account to get the deposit balance for
- `keyringOpts` - optional Keyring options

```js
const did = 'did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785'
const amount = await token.getAmountDeposited(did) // '100'
```

<a name="constrain"></a>
### `token.constrainTokenValue(val)`

Constrains token amount used in the EVM to its nominal value (Ara supports 18 decimals).

- `val` - The unconstrained token value as a `String`

```js
const expandedValue = '1000000000000000000' // 1 Ara Token
const constrainedValue = token.constrainTokenValue(expandedValue) // constrainedValue === '1'
```

<a name="expand"></a>
### `token.expandTokenValue(val)`

Expands nominal token value to its expanded form used in the EVM (Ara supports 18 decimals).

- `val` - The expanded token value as a `String`

```js
const constrainedValue = '1'
const expandedValue = token.expandTokenValue(constrainedValue) // expandedValue === '1000000000000000000'
```

<a name="approveownership"></a>
### `async ownership.approveOwnershipTransfer(opts)`

Approves an AFS ownership transfer request.

- `opts`
  - `contentDid` - The `DID` of the content to transfer ownership
  - `password` - The password of the current owner
  - `afsPassword` - The password of the AFS
  - `newOwnerDid` - The `DID` of the account to transfer ownership to
  - `estimate` - optional Flag to check cost of `approveOwnershipTransfer`
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const receipt = await ownership.approveOwnershipTransfer({
  contentDid,
  password,
  afsPassword,
  newOwnerDid
})
```

<a name="revokeownership"></a>
### `async ownership.revokeOwnershipRequest(opts)`

Revokes an outstanding ownership request of an AFS.

- `opts`
  - `requesterDid` - The `DID` of the account requesting ownership
  - `contentDid` - The `DID` of the content to transfer ownership
  - `password` - The password of the account requesting ownership
  - `estimate` - optional Flag to check cost of `revokeOwnershipRequest`
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const receipt = await ownership.revokeOwnershipRequest({
  requesterDid,
  contentDid,
  password
})
```

<a name="requestownership"></a>
### `async ownership.requestOwnership(opts)`

Requests ownership of an AFS.

- `opts`
  - `requesterDid` - The `DID` of the account requesting ownership
  - `contentDid` - The `DID` of the content to transfer ownership
  - `password` - The password of the account requesting ownership
  - `estimate` - optional Flag to check cost of `requestOwnership`
  - `gasPrice` - Optional gas price in GWei
  - `keyringOpts` - Optional keyring options
  - `onhash`
  - `onreceipt`
  - `onconfirmation`
  - `onerror`
  - `onmined`

Returns transaction `receipt` object.

```js
const receipt = await ownership.requestOwnership({
  requesterDid,
  contentDid,
  password
})
```

<a name="hasrequested"></a>
### `async ownership.hasRequested(opts)`

Checks if a requester `DID` has requested ownership of an AFS.

- `opts`
  - `requesterDid` - The `DID` of the account requesting ownership
  - `contentDid` - The `DID` of the content in question
  - `keyringOpts` - optional Keyring options

Returns `boolean`.

```js
const hasRequested = await ownership.hasRequested({ requesterDid, contentDid })
```

<a name="getowner"></a>
### `async ownership.getOwner(contentDid)`

Gets the Ethereum address of the owner of an AFS.

- `contentDid` - The `DID` of the content to get the owner for

```js
const owner = await ownership.getOwner(contentDid)
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
