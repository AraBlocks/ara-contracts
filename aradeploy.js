const { abi: factoryAbi } = require('./build/contracts/AraFactory.sol')
const replace = require('replace-in-file')
const constants = require('./constants')
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

/* 
 * 12/14/2018 @mahjiang
 *
 * Ultimately this needs to be split into 2 functions:
 * 1) Compiles + writes to disk the bytecode for each contract
 * 2) Calls deployContract() in the AraFactory contract with the stored bytecode
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

  const registryAddress = await _deployRegistry(acct)
  const libraryAddress = await _deployLibrary(acct, registryAddress)
  const tokenAddress = await _deployToken(acct)

  await _replaceConstants(registryAddress, libraryAddress, tokenAddress)

  return {
    registryAddress,
    libraryAddress,
    tokenAddress
  }
}

async function _deployRegistry(acct) {
  const label = 'Registry.sol:Registry'

  const sources = {
    'Proxy.sol': fs.readFileSync(path.resolve(__dirname, './contracts/Proxy.sol'), 'utf8')
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['Registry.sol:Registry']
  const abi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract
  return _sendTx(acct, label, bytecode)
}

async function _deployLibrary(acct, registryAddress) {
  const label = 'Library.sol:Library'

  const sources = {
    'Registry.sol': fs.readFileSync(path.resolve(__dirname, './contracts/Registry.sol'), 'utf8')
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['Library.sol:Library']
  const abi = JSON.parse(compiledContract.interface)
  let { bytecode } = compiledContract
  const bytecodeWithParameters = web3Abi.encodeParameters([ 'address' ], [ registryAddress ]).slice(2)
  bytecode += bytecodeWithParameters
  return _sendTx(acct, label, bytecode)
}

async function _deployToken(acct) {
  const label = 'AraToken.sol:AraToken'

  const sources = {
    'StandardToken.sol': fs.readFileSync(path.resolve(__dirname, './contracts/StandardToken.sol'), 'utf8'),
    'ERC20.sol': fs.readFileSync(path.resolve(__dirname, './contracts/ERC20.sol'), 'utf8'),
    'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync(path.resolve(__dirname, './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol'), 'utf8'),
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['AraToken.sol:AraToken']
  const abi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract
  return _sendTx(acct, label, bytecode)
}

async function _sendTx(acct, label, bytecode) {
  const { tx: transaction, ctx } = await tx.create({
    account:acct,
    to: constants.FACTORY_ADDRESS,
    gasLimit: 7000000,
    data: {
      abi: factoryAbi,
      functionName: 'deployContract',
      values: [ label, bytecode ]
    }
  })

  const { contract: factory, ctx: ctx2 } = await contract.get(abi, constants.FACTORY_ADDRESS)
  address = await new Promise((resolve, reject) => {
    tx.sendSignedTransaction(transaction)
    factory.events.ContractDeployed({ fromBlock: 'latest' })
      .on('data', (log) => {
        const { returnValues: { _label, _deployedAddress } } = log
        if (label === _label) {
          resolve(_deployedAddress)
        }
      })
      .on('error', log => reject(log))
  })
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
  deployAraContracts
}
