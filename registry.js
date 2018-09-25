const { abi } = require('./build/contracts/Registry.json')
const debug = require('debug')('ara-contracts:registry')
const { parse, resolve } = require('path')
const solc = require('solc')
const fs = require('fs')

const {
  web3: {
    tx,
    call,
    ethify,
    account,
    contract,
    abi: web3Abi,
  }
} = require('ara-util')

const {
  AID_PREFIX,
  LIBRARY_ADDRESS,
  REGISTRY_ADDRESS,
  ARA_TOKEN_ADDRESS,
  STANDARD_VERSION
} = require('./constants')

const {
  validate,
  normalize,
  getDocumentOwner
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
    throw TypeError('Expecting non-empty content DID')
  }

  contentDid = normalize(contentDid)

  try {
    return call({
      abi,
      address: REGISTRY_ADDRESS,
      functionName: 'getProxyAddress',
      arguments: [
        ethify(contentDid)
      ]
    })
  } catch (err) {
    throw err
  }
}

async function getProxyVersion(contentDid = '') {
  if (null == contentDid || 'string' !== typeof contentDid || !contentDid) {
    throw TypeError('Expecting non-empty content DID')
  }

  contentDid = normalize(contentDid)

  try {
    return call({
      abi,
      address: REGISTRY_ADDRESS,
      functionName: 'getProxyVersion',
      arguments: [
        ethify(contentDid)
      ]
    })
  } catch (err) {
    throw err
  }
}

/**
 * Upgrades a proxy to a new version // 33834 gas
 * @param  {String} opts.contentDid // unhashed
 * @param  {String} opts.password
 * @param  {String|number} opts.version
 * @return {Bool}
 * @throws {Error,TypeError}
 */
async function upgradeProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (('string' !== typeof opts.version && 'number' !== typeof opts.version) || !opts.version) {
    throw TypeError('Expecting non-empty version string or number')
  }

  let { version } = opts
  const { contentDid, password } = opts

  if ('number' === typeof version) {
    version = version.toString()
  }

  let did
  let ddo
  try {
    ({ did, ddo } = await validate({ did: contentDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  const acct = await account.load({ did: owner, password })

  let upgraded = false
  try {
    const transaction = await tx.create({
      account: acct,
      to: REGISTRY_ADDRESS,
      gasLimit: 1000000,
      data: {
        abi,
        functionName: 'upgradeProxy',
        values: [
          ethify(contentDid),
          version
        ]
      }
    })

    const registry = await contract.get(abi, REGISTRY_ADDRESS)
    // listen to ProxyUpgraded event for proxy address
    await registry.events.ProxyUpgraded({ fromBlock: 'latest', function(error) { console.log(error) } })
      .on('data', (log) => {
        const { returnValues: { _contentId, _version } } = log
        if (_contentId === ethify(did)) {
          upgraded = true
          debug('proxy upgraded to version', _version)
        }
      })
      .on('changed', (log) => {
        console.log(`Changed: ${log}`)
      })
      .on('error', (log) => {
        console.log(`error:  ${log}`)
      })
    const receipt = await tx.sendSignedTransaction(transaction)
    if (receipt.status) {
      debug('gas used', receipt.gasUsed)
    }
  } catch (err) {
    throw err
  }
  return upgraded
}

/**
 * Deploys a proxy contract for opts.contentDid // 349574 gas
 * @param  {String} opts.contentDid // unhashed
 * @param  {String} opts.password
 * @param  {String|number} opts.version
 * @return {string}
 * @throws {Error,TypeError}
 */
async function deployProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if (null == opts.contentDid || 'string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  }

  const { password, contentDid } = opts

  let version = opts.version || STANDARD_VERSION
  if ('number' === typeof version) {
    version = version.toString()
  }

  let did
  let ddo
  try {
    ({ did, ddo } = await validate({ did: contentDid, password, label: 'registry' }))
  } catch (err) {
    throw err
  }

  debug('creating tx to deploy proxy for', did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  let proxyAddress = null
  try {
    const encodedData = web3Abi.encodeParameters(
      [ 'address', 'address', 'address', 'bytes32' ],
      [ acct.address, ARA_TOKEN_ADDRESS, LIBRARY_ADDRESS, ethify(contentDid) ]
    )
    const transaction = await tx.create({
      account: acct,
      to: REGISTRY_ADDRESS,
      gasLimit: 3000000,
      data: {
        abi,
        functionName: 'createAFS',
        values: [
          ethify(did),
          version,
          encodedData
        ]
      }
    })

    // listen to ProxyDeployed event for proxy address
    const registry = await contract.get(abi, REGISTRY_ADDRESS)
    registry.events.ProxyDeployed({ fromBlock: 'latest', function(error) { console.log(error) } })
      .on('data', (log) => {
        const { returnValues: { _contentId, _address } } = log
        if (_contentId === ethify(contentDid)) {
          proxyAddress = _address
          debug('proxy deployed at', proxyAddress)
        }
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const receipt = await tx.sendSignedTransaction(transaction)

    if (receipt.status) {
      debug('gas used', receipt.gasUsed)
    }
  } catch (err) {
    throw err
  }
  return proxyAddress
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
      address: REGISTRY_ADDRESS,
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
  if ('string' !== typeof version || !version) {
    throw TypeError('Expecting non-empty version string.')
  }

  try {
    const address = await call({
      abi,
      address: REGISTRY_ADDRESS,
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
 * Deploys a new AFS Standard // 2322093 gas (contract deploy) + 58053 gas (add standard)
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.password
 * @param  {String} opts.version
 * @param  {String} opts.paths
 * @return {String}
 * @throws {Error,TypeError}
 */
async function deployNewStandard(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.paths || !opts.paths.length) {
    throw TypeError('Expecting one or more paths')
  }

  if (null == opts.version || 'string' !== typeof opts.version || !opts.version) {
    if ('number' === typeof opts.version) {
      opts.version = opts.version.toString()
    } else {
      throw TypeError('Expecting non-empty standard version')
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

  const prefixedDid = `${AID_PREFIX}${did}`
  const acct = await account.load({ did: prefixedDid, password })

  const registryOwner = await call({
    abi,
    address: REGISTRY_ADDRESS,
    functionName: 'owner_'
  })

  if (acct.address != registryOwner) {
    throw new Error('Only the owner of the Registry contract may deploy a new standard.')
  }
  // compile AFS sources and dependencies
  const sources = {
    'ERC20.sol': fs.readFileSync(resolve(__dirname, './contracts/ERC20.sol'), 'utf8'),
    'StandardToken.sol': fs.readFileSync(resolve(__dirname, './contracts/StandardToken.sol'), 'utf8'),
    'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync(resolve(__dirname, './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol'), 'utf8'),
    'bytes/BytesLib.sol': fs.readFileSync(resolve(__dirname, './installed_contracts/bytes/contracts/BytesLib.sol'), 'utf8')
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

  let address = null
  try {
    const { contract: afs, gasLimit } = await contract.deploy({
      account: acct,
      abi: afsAbi,
      bytecode: ethify(bytecode)
    })

    const transaction = await tx.create({
      account: acct,
      to: REGISTRY_ADDRESS,
      gasLimit: 1500000,
      data: {
        abi,
        functionName: 'addStandardVersion',
        values: [
          version,
          afs._address
        ]
      }
    })
    // listen to ProxyDeployed event for proxy address
    const registry = await contract.get(abi, REGISTRY_ADDRESS)
    registry.events.StandardAdded({ fromBlock: 'latest', function(error) { console.log(error) } })
      .on('data', (log) => {
        // debug('STANDARD ADDED', log)
        const { returnValues: { _version, _address } } = log
        if (_version === version) {
          address = _address
          debug('version', _version, 'deployed at', _address)
        }
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const receipt = await tx.sendSignedTransaction(transaction)

    if (receipt.status) {
      debug('gas used', receipt.gasUsed + gasLimit)
      address = address || afs._address
    }
  } catch (err) {
    throw err
  }
  return address
}

module.exports = {
  proxyExists,
  deployProxy,
  getStandard,
  upgradeProxy,
  getProxyAddress,
  getProxyVersion,
  getLatestStandard,
  deployNewStandard
}
