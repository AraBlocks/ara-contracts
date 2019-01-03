const { abi: factoryAbi } = require('./build/contracts/AraFactory.json')
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

  try {
    debug('Deploying...')
    const registryAddress = await _deployRegistry(acct)
    debug(`Deployed Registry at ${registryAddress}.`)
    const libraryAddress = await _deployLibrary(acct, registryAddress)
    debug(`Deployed Library at ${libraryAddress}.`)
    const tokenAddress = await _deployToken(acct)
    debug(`Deployed Ara Token at ${tokenAddress}.`)

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
    debug('Compiling registry...')
    await _compile(
      'Registry.sol:Registry',
      {
        'Registry.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Registry.sol'), 'utf8'),
        'Proxy.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Proxy.sol'), 'utf8')
      },
      `${constants.BYTESDIR}/Registry`
    )
    debug('Compiled registry.')
  } catch (err) {
    throw err
  }
}

async function _compileLibrary() {
  try {
    debug('Compiling library...')
    await _compile(
      'Library.sol:Library',
      {
        'Registry.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Registry.sol'), 'utf8'),
        'Proxy.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Proxy.sol'), 'utf8'),
        'Library.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/Library.sol'), 'utf8')
      },
      `${constants.BYTESDIR}/Library`
    )
    debug('Compiled library.')
  } catch (err) {
    throw err
  }
}

async function _compileToken() {
  try {
    debug('Compiling token...')
    await _compile(
      'AraToken.sol:AraToken',
      {
        'AraToken.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/AraToken.sol'), 'utf8'),
        'StandardToken.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/StandardToken.sol'), 'utf8'),
        'ERC20.sol': await pify(fs.readFile)(path.resolve(__dirname, './contracts/ignored_contracts/ERC20.sol'), 'utf8'),
        'openzeppelin-solidity/contracts/math/SafeMath.sol': await pify(fs.readFile)(path.resolve(__dirname, './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol'), 'utf8'),
      },
      `${constants.BYTESDIR}/Token`
    )
    debug('Compiled token')
  } catch (err) {
    throw err
  }
}

async function _deployRegistry(acct) {
  const label = 'Registry.sol:Registry'

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Registry`))
  const encodedParameters = web3Abi.encodeParameters([ 'address' ], [ acct.address ]).slice(2)
  bytecode += encodedParameters

  return _sendTx(acct, label, bytecode)
}

async function _deployLibrary(acct, registryAddress) {
  const label = 'Library.sol:Library'

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Library`))
  const encodedParameters = web3Abi.encodeParameters([ 'address', 'address' ], [ acct.address, registryAddress ]).slice(2)
  bytecode += encodedParameters

  return _sendTx(acct, label, bytecode)
}

async function _deployToken(acct) {
  const label = 'AraToken.sol:AraToken'

  let bytecode = await pify(fs.readFile)(path.resolve(__dirname, `${constants.BYTESDIR}/Token`))
  const encodedParameters = web3Abi.encodeParameters([ 'address' ], [ acct.address ]).slice(2)
  bytecode += encodedParameters

  return _sendTx(acct, label, bytecode)
}

async function _sendTx(acct, label, bytecode) {
  delete require.cache[require.resolve('./constants')]
  constants = require('./constants')

  let address
  try {
    const { tx: transaction, ctx } = await tx.create({
      account: acct,
      to: constants.FACTORY_ADDRESS,
      gasLimit: 7000000,
      data: {
        abi: factoryAbi,
        functionName: 'deployContract',
        values: [ label, bytecode ]
      }
    })
    ctx.close()

    const { contract: factory, ctx: ctx2 } = await contract.get(factoryAbi, constants.FACTORY_ADDRESS)
    address = await new Promise((resolve, reject) => {
      tx.sendSignedTransaction(transaction)
      factory.events.ContractDeployed()
        .on('data', (log) => {
          const { returnValues: { _label, _deployedAddress } } = log
          if (label === _label) {
            resolve(_deployedAddress)
          }
        })
        .on('error', log => reject(log))
    })
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
  compileAraContracts,
  deployAraContracts
}
