const { abi: registryAbi } = require('./build/contracts/AraRegistry.json')
const debug = require('debug')('ara-contracts:factory')
const replace = require('replace-in-file')
let constants = require('./constants')
const mkdirp = require('mkdirp')
const pify = require('pify')
const path = require('path')
const solc = require('solc')
const fs = require('fs')

const {
  validate,
  web3: {
    tx,
    account,
    contract,
    abi: web3Abi
  }
} = require('ara-util')

async function compileAndDeployAraContracts(opts) {
  try {
    await compileAraContracts()
  } catch (err) {
    debug(`compilation failed with error: ${err.message}`)
  }
  try {
    return deployAraContracts(opts)
  } catch (err) {
    throw err
  }
}

/*
 * Step 1: Compiles contracts into bytecode and saves to disk
 * This step must be performed manually locally before pushing to Github
 */
async function compileAraContracts() {
  try {
    debug('Compiling contracts...')
    await pify(mkdirp)(constants.BYTESDIR)

    await _compileRegistry()
    await _compileLibrary()
    await _compileToken()

    debug('Contracts compiled.')
  } catch (err) {
    throw err
  }
}

/*
 * Step 2: Deploys contracts through the AraFactory contract and saves addresses to Constants.js
 * @param  {String} opts.masterDid
 * @param  {String} opts.password
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {Error, TypeError}
 */
async function deployAraContracts(opts) {
  let acct
  try {
    acct = await _validateMasterOpts(opts)
  } catch (err) {
    throw err
  }

  try {
    debug('Deploying...')
    const registryAddress = await _deployRegistry(acct)
    const libraryAddress = await _deployLibrary(acct, registryAddress)
    const tokenAddress = await _deployToken(acct)

    await _replaceConstants(registryAddress, libraryAddress, tokenAddress)

    return {
      registryAddress,
      libraryAddress,
      tokenAddress
    }
  } catch (err) {
    throw err
  }
}

/*
 * Compiles and upgrades Registry contract
 * @param  {String} opts.masterDid
 * @param  {String} opts.password
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {Error, TypeError}
 */
async function compileAndUpgradeRegistry(opts) {
  try {
    await pify(mkdirp)(constants.BYTESDIR)

    await _compileRegistry()
  } catch (err) {
    throw err
  }
  try {
    const acct = await _validateMasterOpts(opts)

    _deployRegistry(acct, true)
  } catch (err) {
    throw err
  }
}

/*
 * Compiles and upgrades Library contract
 * @param  {String} opts.masterDid
 * @param  {String} opts.password
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {Error, TypeError}
 */
async function compileAndUpgradeLibrary(opts) {
  try {
    await pify(mkdirp)(constants.BYTESDIR)

    await _compileLibrary()
  } catch (err) {
    throw err
  }
  try {
    const acct = await _validateMasterOpts(opts)

    _deployLibrary(acct, constants.REGISTRY_ADDRESS, true)
  } catch (err) {
    throw err
  }
}

/*
 * Compiles and upgrades Token contract
 * @param  {String} opts.masterDid
 * @param  {String} opts.password
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {Error, TypeError}
 */
async function compileAndUpgradeToken(opts) {
  try {
    await pify(mkdirp)(constants.BYTESDIR)

    await _compileToken()
  } catch (err) {
    throw err
  }
  try {
    const acct = await _validateMasterOpts(opts)

    _deployToken(acct, true)
  } catch (err) {
    throw err
  }
}

async function _validateMasterOpts(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.masterDid || !opts.masterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  }

  let { masterDid } = opts
  const { password, keyringOpts } = opts

  let acct
  try {
    ({ did: masterDid } = await validate({
      did: masterDid, password, label: 'factory', keyringOpts
    }))
    masterDid = `${constants.AID_PREFIX}${masterDid}`
    acct = await account.load({ did: masterDid, password })
  } catch (err) {
    throw err
  }
  return acct
}

async function _compile(contractname, sources, bytespath) {
  try {
    const compiledFile = solc.compile({ sources }, 1)
    const compiledContract = compiledFile.contracts[`${contractname}`]
    const { bytecode } = compiledContract

    await pify(fs.writeFile)(path.resolve(__dirname, `${bytespath}`), `0x${bytecode}`)
  } catch (err) {
    throw err
  }
}

async function _compileRegistry() {
  try {
    debug('Compiling Registry...')
    await _compile(
      constants.REGISTRY_LABEL,
      {
        'Registry.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Registry.sol'), 'utf8'),
        'Proxy.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Proxy.sol'), 'utf8')
      },
      `${constants.BYTESDIR}/Registry_${constants.REGISTRY_VERSION}`
    )
    debug('Compiled Registry.')
  } catch (err) {
    throw err
  }
}

async function _compileLibrary() {
  try {
    debug('Compiling Library...')
    await _compile(
      constants.LIBRARY_LABEL,
      {
        'Registry.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Registry.sol'), 'utf8'),
        'Proxy.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Proxy.sol'), 'utf8'),
        'Library.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Library.sol'), 'utf8')
      },
      `${constants.BYTESDIR}/Library_${constants.LIBRARY_VERSION}`
    )
    debug('Compiled Library.')
  } catch (err) {
    throw err
  }
}

async function _compileToken() {
  try {
    debug('Compiling Ara Token...')
    await _compile(
      constants.TOKEN_LABEL,
      {
        'AraToken.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/AraToken.sol'), 'utf8'),
        'StandardToken.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/StandardToken.sol'), 'utf8'),
        'ERC20.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/ERC20.sol'), 'utf8'),
        'openzeppelin-solidity/contracts/math/SafeMath.sol': await pify(fs.readFile)(path.resolve(__dirname, './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol'), 'utf8'),
      },
      `${constants.BYTESDIR}/Token_${constants.TOKEN_VERSION}`
    )
    debug('Compiled Ara Token.')
  } catch (err) {
    throw err
  }
}

async function _deployRegistry(acct, upgrade = false) {
  debug(`${upgrade ? 'Upgrading' : 'Deploying'} Registry contract ${upgrade ? 'to ' : ''}version ${constants.REGISTRY_VERSION}.`)

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Registry_${constants.REGISTRY_VERSION}`))
  const encodedData = web3Abi.encodeParameters([ 'address' ], [ acct.address ])
  bytecode += encodedData.slice(2)

  return _sendTx(acct, constants.REGISTRY_LABEL, constants.REGISTRY_VERSION, bytecode, encodedData, upgrade)
}

async function _deployLibrary(acct, registryAddress, upgrade = false) {
  debug(`${upgrade ? 'Upgrading' : 'Deploying'} Library contract ${upgrade ? 'to ' : ''}version ${constants.LIBRARY_VERSION}.`)

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Library_${constants.LIBRARY_VERSION}`))
  const encodedData = web3Abi.encodeParameters([ 'address', 'address' ], [ acct.address, registryAddress ])
  bytecode += encodedData.slice(2)

  return _sendTx(acct, constants.LIBRARY_LABEL, constants.LIBRARY_VERSION, bytecode, encodedData, upgrade)
}

async function _deployToken(acct, upgrade = false) {
  debug(`${upgrade ? 'Upgrading' : 'Deploying'} Token contract ${upgrade ? 'to ' : ''}version ${constants.TOKEN_VERSION}.`)

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Token_${constants.TOKEN_VERSION}`))
  const encodedData = web3Abi.encodeParameters([ 'address' ], [ acct.address ])
  bytecode += encodedData.slice(2)

  return _sendTx(acct, constants.TOKEN_LABEL, constants.TOKEN_VERSION, bytecode, encodedData, upgrade)
}

async function _sendTx(acct, label, version, bytecode, data, upgrade = false) {
  delete require.cache[require.resolve('./constants')]
  constants = require('./constants')

  let address
  try {
    const { tx: transaction, ctx } = await tx.create({
      account: acct,
      to: constants.ARA_REGISTRY_ADDRESS,
      gasLimit: 7000000,
      data: {
        abi: registryAbi,
        functionName: upgrade ? 'upgradeContract' : 'addNewUpgradeableContract',
        values: [ label, version, bytecode, data ]
      }
    })
    ctx.close()

    const { contract: registry, ctx: ctx2 } = await contract.get(registryAbi, constants.ARA_REGISTRY_ADDRESS)
    if (!upgrade) {
      address = await new Promise((resolve, reject) => {
        tx.sendSignedTransaction(transaction)
        registry.events.ProxyDeployed()
          .on('data', (log) => {
            const { returnValues: { _contractName, _address } } = log
            if (label === _contractName) {
              debug(`Proxy deployed for ${label} at ${_address}`)
              resolve(_address)
            }
          })
          .on('error', log => reject(log))
      })
    } else {
      await new Promise((resolve, reject) => {
        tx.sendSignedTransaction(transaction)
        registry.events.ContractUpgraded()
          .on('data', (log) => {
            const { returnValues: { _contractName, _version } } = log
            if (label === _contractName && version === _version) {
              debug(`${label} upgraded to version ${version}.`)
              resolve()
            }
          })
          .on('error', log => reject(log))
      })
    }
    ctx2.close()
  } catch (err) {
    throw err
  }
  return address
}

async function _replaceConstants(registryAddress, libraryAddress, tokenAddress) {
  const constantsPath = path.resolve(__dirname, './constants.js')
  const options = {
    files: constantsPath,
    from: [ constants.REGISTRY_ADDRESS, constants.LIBRARY_ADDRESS, constants.ARA_TOKEN_ADDRESS ],
    to: [ registryAddress, libraryAddress, tokenAddress ]
  }
  await replace(options)
}

module.exports = {
  compileAndDeployAraContracts,
  compileAndUpgradeRegistry,
  compileAndUpgradeLibrary,
  compileAndUpgradeToken,
  compileAraContracts,
  deployAraContracts
}
