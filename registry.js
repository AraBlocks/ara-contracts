const { abi } = require('./build/contracts/Registry.json')
const debug = require('debug')('ara-contracts:registry')
const contract = require('ara-web3/contract')
const account = require('ara-web3/account')
const { call } = require('ara-web3/call')
const web3Abi = require('ara-web3/abi')
const tx = require('ara-web3/tx')
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
    debug("proxy address", address)
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

  contentDid = hashDID(contentDid)
  const prefixedDid = kAidPrefix + did

  const acct = await account.load({ did: prefixedDid, password })

  try {
    debug("creating tx to deploy proxy for", contentDid)
    const transaction = await tx.create({
      account: acct,
      to: kRegistryAddress,
      gasLimit: 6721975,
      data: {
        abi,
        functionName: 'createAFS',
        values: [
          contentDid,
          version,
          web3Abi.encodeParameters(['address', 'address'], [kARATokenAddress, kLibraryAddress])
        ]
      }
    })

    // listen to ProxyDeployed event for proxy address
    const registry = await contract.get(abi, kRegistryAddress)
    let proxyAddress
    const deployedEvent = await registry.events.ProxyDeployed({fromBlock: 0, function(error, event){ console.log(error) }})
      .on('data', (log) => {
        // console.log(log)
        let { returnValues: { _contentId, _address }, blockNumber } = log
        if (_contentId === contentDid) {
          console.log("PROXY DEPLOYED!!!!!")
          proxyAddress = _address
        }
      })
      .on('changed', (log) => {
        console.log(`Changed: ${log}`)
      })
      .on('error', (log) => {
        console.log(`error:  ${log}`)
      })

      // listen to ProxyUpgraded event for proxy address
    const upgradedEvent = await registry.events.ProxyUpgraded({fromBlock: 0, function(error, event){ console.log(error) }})
      .on('data', (log) => {
        // console.log(log)
        let { returnValues: { _contentId, _version }, blockNumber } = log
        if (_contentId === contentDid)
          console.log("PROXY UPGRADED!!!!!")
      })
      .on('changed', (log) => {
        console.log(`Changed: ${log}`)
      })
      .on('error', (log) => {
        console.log(`error:  ${log}`)
      })

    await tx.sendSignedTransaction(transaction)
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
  } else if (null == opts.requesterDid || 'string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty requester DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.registry: Expecting non-empty password')
  } else if (null == opts.version || 'string' !== typeof opts.version || !opts.version) {
    throw TypeError('ara-contracts.registry: Expecting non-empty stadard version')
  } else if (null == opts.path || 'string' !== typeof opts.path || !opts.path) {
    throw TypeError('ara-contracts.registry: Expecting non-empty path')
  }

  const {
    requesterDid,
    password,
    version,
    path
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

  const source = fs.readFileSync(path, 'utf8')
  const compiledFile = solc.compile(source, 1)
  const compiledContract = compiledFile.contracts.AFS
  const afsAbi = compiledContract.interface
  const { bytecode } = compiledContract

  try {
    const afs = await contract.deploy({
      account: acct,
      abi: afsAbi,
      bytecode,
      arguments: [
        kLibraryAddress,
        kARATokenAddress
      ]
    })

    const transaction = await tx.create({
      account: acct,
      to: kRegistryAddress,
      data: {
        afsAbi,
        functionName: 'addStandardVersion',
        values: [
          version,
          afs.options.address
        ]
      }
    })

    await tx.sendSignedTransaction(transaction)

    return afs.options.address
  } catch (err) {
    throw err
  }
}

module.exports = {
  proxyExists,
  getLatestStandard,
  getStandard,
  deployNewStandard,
  getProxyAddress,
  deployProxy
}
