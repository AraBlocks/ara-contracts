const { abi } = require('./build/contracts/Registry.json')
const debug = require('debug')('ara-contracts:purchase')
const contract = require('ara-web3/contract')
const account = require('ara-web3/account')
const { call } = require('ara-web3/call')
const tx = require('ara-web3/tx')
const solc = require('solc')

const {
  kLibraryAddress,
  kRegistryAddress,
  kARATokenAddress
} = require('./constants')

const {
  hashIdentity,
  normalize
} = require('./util')

/**
 * Gets the proxy contract address for contentDid
 * @param  {String} contentDid
 * @return {string}
 * @throws {Error,TypeError}
 */
async function getProxyAddress(contentDid = '') {
  if (null == contentDid || 'string' !== typeof contentDid || !contentDid) {
    throw TypeError('ara-contracts.registry: Expecting non-empty content DID')
  }

  contentDid = hashIdentity(normalize(contentDid))

  try {
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
 * Gets the current AFS contract stndard
 * @return {Object}
 * @throws {Error}
 */
async function getCurrentStandard() {
  try{
    const address = await call({
      abi,
      address: kRegistryAddress,
      functionName: 'standard_'
    })

    const version = await call({
      abi,
      address: kRegistryAddress,
      functionName: 'version_'
    })

    return {
      address,
      version
    }
  } catch (err) {
    throw err
  }
}

/**
 * Deploys a new AFS Stndard
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.password
 * @param  {String} opts.version
 * @param  {String} opts.path
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

  const { requesterDid, password, version, path } = opts
  try {
    const ({ did } = await validate({ did: requesterDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }

  const registry = contract.get(abi, kRegistryAddress)
  const acct = await account.load({ did, password })

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
  const compiledContract = compiledFile.contracts['AFS']
  const afsAbi = compiledContract.interface
  const bytecode = compiledContract.bytecode
  
  const AFS = await contract.deploy({
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
      version,
      AFS.address
    }
  })
  await tx.sendSignedTransaction(transaction)
}

module.exports = {
  getProxyAddress,
  getCurrentStandard,
  deployNewStandard
}
