const { abi: factoryAbi } = require('./build/contracts/AraFactory.sol')
const constants = require('./constants')
const { resolve } = require('path')
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

  await _deployRegistry(acct)
  await _deployLibrary(acct)
  await _deployToken(acct)
}

async function _deployRegistry(acct) {
  const sources = {
    'Proxy.sol': fs.readFileSync(resolve(__dirname, './contracts/Proxy.sol'), 'utf8')
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['Registry.sol:Registry']
  const abi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract
  const { tx: transaction, ctx } = await tx.create({
    account:acct,
    to: constants.FACTORY_ADDRESS,
    gasLimit: 7000000,
    data: {
      abi: factoryAbi,
      functionName: 'deployContract',
      values: [ bytecode ]
    }
  })

  const { contract: factory, ctx: ctx2 } = await contract.get(abi, constants.FACTORY_ADDRESS)
  address = await new Promise((resolve, reject) => {
    tx.sendSignedTransaction(transaction)
    factory.events.ContractDeployed({ fromBlock: 'latest' })
      .on('data', (log) => {
        const { returnValues: { _deployedAddress } } = log
        resolve(_deployedAddress)
      })
      .on('error', log => reject(log))
  })
}

async function _deployLibrary(acct, registryAddress) {
  const sources = {
    'Registry.sol': fs.readFileSync(resolve(__dirname, './contracts/Registry.sol'), 'utf8')
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['Library.sol:Library']
  const abi = JSON.parse(compiledContract.interface)
  let { bytecode } = compiledContract
  const bytecodeWithParameters = web3Abi.encodeParameters([ 'address' ], [ registryAddress ]).slice(2)
  bytecode += bytecodeWithParameters
  const { tx: transaction, ctx } = await tx.create({
    account:acct,
    to: constants.FACTORY_ADDRESS,
    gasLimit: 7000000,
    data: {
      abi: factoryAbi,
      functionName: 'deployContract',
      values: [ bytecode ]
    }
  })
}

async function _deployToken(acct) {
  const sources = {
    'StandardToken.sol': fs.readFileSync(resolve(__dirname, './contracts/StandardToken.sol'), 'utf8'),
    'ERC20.sol': fs.readFileSync(resolve(__dirname, './contracts/ERC20.sol'), 'utf8'),
    'openzeppelin-solidity/contracts/math/SafeMath.sol': fs.readFileSync(resolve(__dirname, './node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol'), 'utf8'),
  }
  const compiledFile = solc.compile({ sources }, 1)
  const compiledContract = compiledFile.contracts['AraToken.sol:AraToken']
  const abi = JSON.parse(compiledContract.interface)
  const { bytecode } = compiledContract
  const { tx: transaction, ctx } = await tx.create({
    account:acct,
    to: constants.FACTORY_ADDRESS,
    gasLimit: 7000000,
    data: {
      abi: factoryAbi,
      functionName: 'deployContract',
      values: [ bytecode ]
    }
  })
}
