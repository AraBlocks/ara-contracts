const { abi } = require('./build/contracts/Registry.json')
const { abi: aAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:registry')
const contract = require('ara-web3/contract')
const account = require('ara-web3/account')
const { call } = require('ara-web3/call')
const web3Abi = require('ara-web3/abi')
const tx = require('ara-web3/tx')
const { parse } = require('path')
const solc = require('solc')
const rc = require('./rc')
const fs = require('fs')

const { web3 } = require('ara-context')()

const {
  kAidPrefix,
  kLibraryAddress,
  kRegistryAddress,
  kARATokenAddress
} = require('./constants')

const {
  getDocumentOwner,
  hashDID,
  validate
} = require('ara-util')

async function proxyExists(contentDid = '') {
  try {
    const address = await getProxyAddress(contentDid)
    return !/^0x0+$/.test(address)
  } catch (err) {
    return false
  }
}

/**
 * Gets the proxy contract address for contentDid
 * @param  {String} contentDid //unhashed
 * @return {string}
 * @throws {Error,TypeError}
 */
async function getProxyAddress(contentDid = '') {
  if (null == contentDid || 'string' !== typeof contentDid || !contentDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty content DID')
  }

  contentDid = hashDID(contentDid)

  try {
    debug("get proxy address of", contentDid)
    return call({
      abi,
      address: kRegistryAddress,
      functionName: 'getProxyAddress',
      arguments: [
        contentDid
      ]
    })
  } catch (err) {
    throw err
  }
}

/**
 * Upgrades a proxy to a new version
 * @param  {String} opts.contentDid // unhashed
 * @param  {String} opts.password
 * @param  {String} opts.version
 * @return {Bool}
 * @throws {Error,TypeError}
 */
async function upgradeProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.registry: Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty content DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.registry: Expecting non-empty password')
  } else if ('string' !== typeof opts.version || !opts.version) {
    throw TypeError('ara-contracts.registry: Expecting non-empty version string')
  }

  contentDid = hashDID(contentDid)

  let did
  try {
    ({ did } = await validate({ did: contentDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }

  const prefixedDid = kAidPrefix + did

  const acct = await account.load({ did: prefixedDid, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: kRegistryAddress,
      gasLimit: 6721975,
      data: {
        abi,
        functionName: 'upgradeProxy',
        values: [
          contentDid,
          version
        ]
      }
    })

    const registry = await contract.get(abi, kRegistryAddress)
    // listen to ProxyUpgraded event for proxy address
    let upgraded
    const upgradedEvent = await registry.events.ProxyUpgraded({ fromBlock: 0, function(error, event){ console.log(error) }})
      .on('data', (log) => {
        let { returnValues: { _contentId, _version }, blockNumber } = log
        if (_contentId === contentDid)
          upgraded = true
      })
      .on('changed', (log) => {
        console.log(`Changed: ${log}`)
      })
      .on('error', (log) => {
        console.log(`error:  ${log}`)
      })
    await tx.sendSignedTransaction(transaction)
    return upgraded
  } catch (err) {
    throw err
  }
}

/**
 * Deploys a proxy contract for opts.contentDid
 * @param  {String} opts.contentDid // unhashed
 * @param  {String} opts.password
 * @param  {String} opts.version
 * @return {string}
 * @throws {Error,TypeError}
 */
async function deployProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.registry: Expecting opts object.')
  } else if (null == opts.contentDid || 'string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty content DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.registry: Expecting non-empty password')
  }

  const { password } = opts
  let { contentDid } = opts

  const version = opts.version || '1'

  let did
  try {
    ({ did } = await validate({ did: contentDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }

  debug("creating tx to deploy proxy for", contentDid)
  contentDid = hashDID(contentDid)
  const prefixedDid = kAidPrefix + did

  const acct = await account.load({ did: prefixedDid, password })

  try {
    const encodedData = web3Abi.encodeParameters(['address', 'address'], [kARATokenAddress, kLibraryAddress])
    const transaction = await tx.create({
      account: acct,
      to: kRegistryAddress,
      gasLimit: 1000000,
      data: {
        abi,
        functionName: 'createAFS',
        values: [
          contentDid,
          version,
          encodedData
        ]
      }
    })

    // listen to ProxyDeployed event for proxy address
    const registry = await contract.get(abi, kRegistryAddress)
    let proxyAddress
    const deployedEvent = await registry.events.ProxyDeployed({ fromBlock: 0, function(error, event){ console.log(error) }})
      .on('data', (log) => {
        let { returnValues: { _contentId, _address }, blockNumber } = log
        if (_contentId === contentDid) {
          proxyAddress = _address
        }
      })
      .on('changed', (log) => {
        console.log(`Changed: ${log}`)
      })
      .on('error', (log) => {
        console.log(`error:  ${log}`)
      })
    const receipt = await tx.sendSignedTransaction(transaction)
    debug("gas used", receipt.gasUsed)
    return proxyAddress
  } catch (err) {
    throw err
  }
}

/**
 * Gets the latest AFS contract stndard
 * @return {String}
 * @throws {Error}
 */
async function getLatestStandard() {
  try {
    const version = await call({
      abi,
      address: kRegistryAddress,
      functionName: 'latestVersion_'
    })
    return getStandard(version)
  } catch (err) {
    throw err
  }
}

/**
 * Gets an AFS contract stndard
 * @param  {String} version
 * @return {String}
 * @throws {Error}
 */
async function getStandard(version) {
  try {
    const address = await call({
      abi,
      address: kRegistryAddress,
      functionName: 'getImplementation',
      arguments: [
        version
      ]
    })
    return address
  } catch (err) {
    throw err
  }
}

/**
 * Deploys a new AFS Standard
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.password
 * @param  {String} opts.version
 * @param  {String} opts.path
 * @return {String}
 * @throws {Error,TypeError}
 */
async function deployNewStandard(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.registry: Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.registry: Expecting non-empty password')
  } else if (!opts.paths || !opts.paths.length) {
    throw TypeError('ara-contracts.registry: Expecting one or more paths')
  }

  if (null == opts.version || 'string' !== typeof opts.version || !opts.version) {
    if ('number' === typeof opts.version) {
      opts.version = opts.version.toString()
    } else {
      throw TypeError('ara-contracts.registry: Expecting non-empty standard version')
    }
  } 

  const {
    requesterDid,
    password,
    version,
    paths
  } = opts

  let did
  try {
    ({ did } = await validate({ owner: requesterDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }

  const prefixedDid = kAidPrefix + did
  const acct = await account.load({ did: prefixedDid, password })

  const registryOwner = await call({
    abi,
    address: kRegistryAddress,
    functionName: 'owner_'
  })

  if (acct.address != registryOwner) {
    throw new Error('ara-contracts.registry: Only the owner of the Registry contract may deploy a new standard.')
  }

  // compile AFS sources and dependencies
  let sources = {
    'openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol', 'utf8'),
    'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol':      fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol', 'utf8'),
    'openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol': fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol', 'utf8'),
    'openzeppelin-solidity/contracts/math/SafeMath.sol':          fs.readFileSync('./node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol', 'utf8')
  }
  paths.forEach((path) => {
    const src = fs.readFileSync(path, 'utf8')
    path = parse(path).base
    sources[path] = src
  })
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['AFS.sol:AFS']
  const afsAbi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract

  try {
    const afs = await contract.deploy({
      account: acct,
      abi: afsAbi,
      bytecode
    })
    const transaction = await tx.create({
      account: acct,
      to: kRegistryAddress,
      data: {
        abi,
        functionName: 'addStandardVersion',
        values: [
          version,
          afs._address
        ]
      }
    })
    const receipt = await tx.sendSignedTransaction(transaction)
    debug("gas used", receipt.gasUsed)
    return afs._address
  } catch (err) {
    throw err
  }
}

module.exports = {
  proxyExists,
  deployProxy,
  getStandard,
  upgradeProxy,
  getProxyAddress,
  getLatestStandard,
  deployNewStandard
}
