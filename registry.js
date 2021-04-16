/* eslint-disable no-shadow */

const { abi } = require('./build/contracts/Registry.json')
const debug = require('debug')('ara-contracts:registry')
const rc = require('ara-runtime-configuration')()
const { parse, resolve } = require('path')
const pify = require('pify')
const path = require('path')
const solc = require('solc')
const fs = require('fs')

const {
  validate,
  getIdentifier,
  getDocumentOwner,
  web3: {
    tx,
    call,
    account,
    contract,
    abi: web3Abi,
  },
  transform: {
    toHexString
  }
} = require('ara-util')
let constants = require('./constants')

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

  contentDid = getIdentifier(contentDid)

  try {
    return call({
      abi,
      address: constants.REGISTRY_ADDRESS,
      functionName: 'getProxyAddress',
      arguments: [
        toHexString(contentDid, { encoding: 'hex', ethify: true })
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

  contentDid = getIdentifier(contentDid)

  try {
    return call({
      abi,
      address: constants.REGISTRY_ADDRESS,
      functionName: 'getProxyVersion',
      arguments: [
        toHexString(contentDid, { encoding: 'hex', ethify: true })
      ]
    })
  } catch (err) {
    throw err
  }
}

/**
 * Upgrades a proxy to a new version // 33834 gas
 * @param  {String}        opts.contentDid // unhashed
 * @param  {String}        opts.password
 * @param  {String}        opts.afsPassword
 * @param  {String|number} opts.version
 * @param  {Object}        [opts.keyringOpts]
 * @param  {Number}        [opts.gasPrice]
 * @param  {Function}      [opts.onhash]
 * @param  {Function}      [opts.onreceipt]
 * @param  {Function}      [opts.onconfirmation]
 * @param  {Function}      [opts.onerror]
 * @param  {Function}      [opts.onmined]
 * @return {Bool}
 * @throws {Error,TypeError}
 */
async function upgradeProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (null == opts.password || 'string' !== typeof opts.password || !opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (opts.afsPassword && 'string' !== typeof opts.afsPassword) {
    throw TypeError('Expecting non-empty password.')
  } else if (('string' !== typeof opts.version && 'number' !== typeof opts.version) || !opts.version) {
    throw new TypeError('Expecting non-empty version string or number')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting estimate to be of type boolean')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  let { version, afsPassword } = opts
  const {
    contentDid,
    password,
    keyringOpts,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  const estimate = opts.estimate || false

  afsPassword = afsPassword || password

  if ('number' === typeof version) {
    version = version.toString()
  }

  let did
  let ddo
  try {
    ({ did, ddo } = await validate({
      did: contentDid, password: afsPassword, label: 'registry', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  if (constants.ZERO_ADDRESS === await getStandard(version)) {
    throw new Error(`AFS Standard version ${version} does not exist. Please try again with an existing version.`)
  }

  let owner = getDocumentOwner(ddo, true)
  owner = `${constants.AID_PREFIX}${owner}`

  const acct = await account.load({ did: owner, password })

  let upgraded = false
  try {
    const { tx: transaction, ctx: ctx1 } = await tx.create({
      account: acct,
      to: constants.REGISTRY_ADDRESS,
      gasLimit: 1000000,
      gasPrice,
      data: {
        abi,
        functionName: 'upgradeProxy',
        values: [
          toHexString(contentDid, { encoding: 'hex', ethify: true }),
          version
        ]
      }
    })

    if (estimate) {
      const cost = tx.estimateCost(transaction)
      ctx1.close()
      return cost
    }

    const { contract: registry, ctx: ctx2 } = await contract.get(abi, constants.REGISTRY_ADDRESS)
    upgraded = await new Promise((resolve, reject) => {
      tx.sendSignedTransaction(transaction, {
        onhash,
        onreceipt,
        onconfirmation,
        onerror,
        onmined
      })
      // listen to ProxyUpgraded event for proxy address
      registry.events.ProxyUpgraded({ fromBlock: 'latest' })
        .on('data', (log) => {
          const { returnValues: { _contentId } } = log
          if (_contentId === toHexString(did, { encoding: 'hex', ethify: true })) {
            resolve(true)
          }
        })
        .on('error', (log) => reject(log))
    })
    ctx2.close()
    ctx1.close()
  } catch (err) {
    throw err
  }
  return upgraded
}

/**
 * Deploys a proxy contract for opts.contentDid // 349574 gas
 * @param  {String}        opts.contentDid // unhashed
 * @param  {String}        opts.password
 * @param  {String}        opts.afsPassword
 * @param  {String|number} opts.version
 * @param  {Boolean}       [opts.estimate]
 * @param  {Object}        [opts.keyringOpts]
 * @param  {String}        [opts.ownerDid] // only used for estimate
 * @param  {Number}        [opts.gasPrice]
 * @param  {Function}      [opts.onhash]
 * @param  {Function}      [opts.onreceipt]
 * @param  {Function}      [opts.onconfirmation]
 * @param  {Function}      [opts.onerror]
 * @param  {Function}      [opts.onmined]
 * @return {string}
 * @throws {Error,TypeError}
 */
async function deployProxy(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty string for content DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (opts.afsPassword && 'string' !== typeof opts.afsPassword) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting estimate to be of type boolean')
  } else if (opts.ownerDid && 'string' !== typeof opts.ownerDid) {
    throw new TypeError('Expecting non-empty string for owner DID')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a number. Got ${opts.gasPrice}.`)
  }

  let { ownerDid, afsPassword } = opts
  const {
    contentDid,
    password,
    keyringOpts,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  const estimate = opts.estimate || ownerDid || false

  afsPassword = afsPassword || password

  const network = rc.web3.network_id

  const defaultVersion = 'mainnet' === network ? constants.MAIN_STANDARD_VERSION : constants.TEST_STANDARD_VERSION
  let version = opts.version || defaultVersion
  if ('number' === typeof version) {
    version = version.toString()
  }

  // content DID identifier
  let did
  // owner account
  let acct
  if (!ownerDid) {
    // content DDO
    let ddo
    try {
      ({ did, ddo } = await validate({
        did: contentDid, password: afsPassword, label: 'registry', keyringOpts
      }))
    } catch (err) {
      throw err
    }

    try {
      const address = await getProxyAddress(did)
      if (!/^0x0+$/.test(address)) {
        throw new Error(`Proxy for ${did} already exists. No need to deploy proxy.`)
      }
    } catch (err) {
      throw err
    }

    debug('creating tx to deploy proxy for', did)
    let owner = getDocumentOwner(ddo, true)
    owner = `${constants.AID_PREFIX}${owner}`
    acct = await account.load({ did: owner, password })
  } else {
    try {
      await validate({
        did: ownerDid, password, label: 'registry', keyringOpts
      })
    } catch (err) {
      throw err
    }
    did = getIdentifier(contentDid)
    debug('estimating cost to deploy for fake did', did)
    ownerDid = `${constants.AID_PREFIX}${getIdentifier(ownerDid)}`
    acct = await account.load({ did: ownerDid, password })
  }

  let proxyAddress = null
  try {
    const encodedData = web3Abi.encodeParameters(
      [ 'address', 'address', 'address', 'bytes32' ],
      [ acct.address, constants.ARA_TOKEN_ADDRESS, constants.LIBRARY_ADDRESS, toHexString(did, { encoding: 'hex', ethify: true }) ]
    )
    const { tx: transaction, ctx: ctx1 } = await tx.create({
      account: acct,
      to: constants.REGISTRY_ADDRESS,
      gasLimit: 3000000,
      gasPrice,
      data: {
        abi,
        functionName: 'createAFS',
        values: [
          toHexString(did, { encoding: 'hex', ethify: true }),
          version,
          encodedData
        ]
      }
    })
    if (estimate) {
      const cost = tx.estimateCost(transaction)
      ctx1.close()
      return cost
    }

    const { contract: registry, ctx: ctx2 } = await contract.get(abi, constants.REGISTRY_ADDRESS)
    proxyAddress = await new Promise((resolve, reject) => {
      tx.sendSignedTransaction(transaction, {
        onhash,
        onreceipt,
        onconfirmation,
        onerror,
        onmined
      })
      // listen to ProxyDeployed event for proxy address
      registry.events.ProxyDeployed({ fromBlock: 'latest' })
        .on('data', (log) => {
          const { returnValues: { _contentId, _address } } = log
          if (_contentId === toHexString(did, { encoding: 'hex', ethify: true })) {
            resolve(_address)
          }
        })
        .on('error', (log) => reject(log))
    })
    ctx2.close()
    ctx1.close()
    debug('proxy deployed at', proxyAddress)
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
      address: constants.REGISTRY_ADDRESS,
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
  if (null == version || 'string' !== typeof version || !version) {
    if ('number' === typeof version) {
      version = version.toString()
    } else {
      throw TypeError('Expecting non-empty standard version')
    }
  }

  try {
    const address = await call({
      abi,
      address: constants.REGISTRY_ADDRESS,
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

async function _compileStandard(bytespath, paths) {
  // compile AFS sources and dependencies
  const sources = {
    'ERC20.sol': await pify(fs.readFile)(resolve(__dirname, './contracts/ignored_contracts/ERC20.sol'), 'utf8'),
    'StandardToken.sol': await pify(fs.readFile)(resolve(__dirname, './contracts/ignored_contracts/StandardToken.sol'), 'utf8'),
    'SafeMath.sol': await pify(fs.readFile)(resolve(__dirname, './contracts/SafeMath.sol'), 'utf8'),
    'Ownable.sol': await pify(fs.readFile)(resolve(__dirname, './contracts/ignored_contracts/Ownable.sol'), 'utf8'),
    'bytes/BytesLib.sol': await pify(fs.readFile)(resolve(__dirname, './installed_contracts/bytes/contracts/BytesLib.sol'), 'utf8'),
    'SafeMath32.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/SafeMath32.sol'), 'utf8')
  }

  paths.forEach((path) => {
    const src = fs.readFileSync(path, 'utf8')
    path = parse(path).base
    sources[path] = src
  })

  const compiledFile = solc.compile({ sources }, 1)
  const label = Object.keys(compiledFile.contracts)[0]
  debug(`writing bytecode for ${label}`)
  const compiledContract = compiledFile.contracts[label]
  const afsAbi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract
  const bytes = toHexString(bytecode, { encoding: 'hex', ethify: true })

  await pify(fs.writeFile)(bytespath, bytes)
  return { bytes, afsAbi }
}

/**
 * Deploys a new AFS Standard // 2322093 gas (contract deploy) + 58053 gas (add standard)
 * @param  {Object}   opts
 * @param  {String}   opts.requesterDid
 * @param  {String}   opts.password
 * @param  {String}   opts.version
 * @param  {String}   opts.paths
 * @param  {Object}   [opts.keyringOpts]
 * @param  {String}   [opts.compiledPath]
 * @param  {Number}   [opts.gasPrice]
 * @param  {Function} [opts.onhash]
 * @param  {Function} [opts.onreceipt]
 * @param  {Function} [opts.onconfirmation]
 * @param  {Function} [opts.onerror]
 * @param  {Function} [opts.onmined]
 * @return {String}
 * @throws {Error,TypeError}
 */
async function deployNewStandard(opts) {
  // ensures compatability with truffle migrate step
  delete require.cache[require.resolve('./constants')]
  constants = require('./constants')

  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.paths || !opts.paths.length) {
    throw TypeError('Expecting one or more paths')
  } else if (opts.compiledPath && 'string' !== typeof opts.compiledPath) {
    throw new TypeError('Expecting path to be a string.')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  if (null == opts.version || 'string' !== typeof opts.version || !opts.version) {
    if ('number' === typeof opts.version) {
      opts.version = opts.version.toString()
    } else {
      throw TypeError('Expecting non-empty standard version')
    }
  }

  let { compiledPath } = opts
  compiledPath = compiledPath || './build/contracts/AFS.json'
  const {
    requesterDid,
    gasPrice = 0,
    keyringOpts,
    password,
    version,
    paths,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  let did
  try {
    ({ did } = await validate({
      did: requesterDid, password, label: 'registry', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  try {
    const address = await getStandard(version)
    if (!/^0x0+$/.test(address)) {
      throw new Error(`AFS Standard version ${version} already exists. Please try again with a different version name.`)
    }
  } catch (err) {
    throw err
  }

  const prefixedDid = `${constants.AID_PREFIX}${did}`
  const acct = await account.load({ did: prefixedDid, password })
  const registryOwner = await call({
    abi,
    address: constants.REGISTRY_ADDRESS,
    functionName: 'owner_'
  })

  if (acct.address != registryOwner) {
    throw new Error('Only the owner of the Registry contract may deploy a new standard.')
  }

  const bytespath = path.resolve(__dirname, `${constants.BYTESDIR}/Standard_${version}`)
  let bytes
  let afsAbi
  try {
    bytes = await pify(fs.readFile)(bytespath, 'utf8')

    /* eslint-disable import/no-dynamic-require */
    const compiledAfs = require(compiledPath)
    afsAbi = compiledAfs.abi
  } catch (err) {
    debug(`Could not read ${bytespath}; compiling instead...`)

    const { bytes: b, afsAbi: a } = await _compileStandard(bytespath, paths)
    bytes = b
    afsAbi = a
  }

  let address = null
  try {
    ({ contractAddress: address } = await contract.deploy({
      account: acct,
      abi: afsAbi,
      bytecode: bytes
    }))
    const { tx: transaction, ctx: ctx1 } = await tx.create({
      account: acct,
      to: constants.REGISTRY_ADDRESS,
      gasLimit: 7000000,
      gasPrice,
      data: {
        abi,
        functionName: 'addStandardVersion',
        values: [
          version,
          address
        ]
      }
    })
    // listen to ProxyDeployed event for proxy address
    await tx.sendSignedTransaction(transaction, {
      onhash,
      onreceipt,
      onconfirmation,
      onerror,
      onmined
    })
    ctx1.close()
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
