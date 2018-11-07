const { web3: { tx, call, isAddress } } = require('ara-util')
const { abi } = require('./build/contracts/AFS.json')

async function read(opts) {
  _validateOpts(opts)
  const { address, fileIndex, offset } = opts

  return call({
    abi,
    address,
    functionName: 'read',
    arguments: [
      fileIndex,
      offset
    ]
  })
}

async function write(opts, estimate = true, append = false) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts to be of type object')
  } else if (!opts.mtData || 'object' !== typeof opts.mtData) {
    throw new TypeError('Expecting opts.mtData to be of type object')
  } else if (!opts.msData || 'object' !== typeof opts.msData) {
    throw new TypeError('Expecting opts.msData to be of type object')
  } else if (!opts.to || 'string' !== typeof opts.to || !isAddress(opts.to)) {
    throw new TypeError('Expecting opts.to to be valid Ethereum address')
  } else if (!opts.account || 'object' !== typeof opts.account) {
    throw new TypeError('Expecting opts.account to be valid Ethereum account')
  }

  const { offsets: mtOffsets, buffer: mtBuffer } = opts.mtData
  const { offsets: msOffsets, buffer: msBuffer } = opts.msData
  const { account, to } = opts

  const transaction = await tx.create({
    gasLimit: 4000000,
    account,
    to,
    data: {
      abi,
      functionName: append ? 'append' : 'write',
      values: [
        mtOffsets,
        msOffsets,
        mtBuffer,
        msBuffer
      ]
    }
  })

  if (estimate) {
    return tx.estimateCost(transaction)
  }

  return tx.sendSignedTransaction(transaction)
}

async function hasBuffer(opts) {
  _validateOpts(opts)

  if (!opts.buffer || 'string' !== typeof opts.buffer) {
    throw new TypeError('Expecting valid hex string for opts.buffer')
  }

  const {
    fileIndex,
    address,
    offset,
    buffer
  } = opts

  return call({
    abi,
    address,
    functionName: 'hasBuffer',
    arguments: [
      fileIndex,
      offset,
      buffer
    ]
  })
}

function _validateOpts(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts to be of type object')
  } else if (!opts.address || 'string' !== typeof opts.address || !isAddress(opts.address)) {
    throw new TypeError('Expecting opts.address to be valid Ethereum address')
  } else if (!Object.prototype.hasOwnProperty.call(opts, 'fileIndex')
      || 'number' !== typeof opts.fileIndex) {
    throw new TypeError('Expecting opts.fileIndex to be of type number')
  } else if (!Object.prototype.hasOwnProperty.call(opts, 'offset')
      || 'number' !== typeof opts.offset) {
    throw new TypeError('Expecting opts.offset to be of type number')
  }
}

module.exports = {
  hasBuffer,
  write,
  read
}
