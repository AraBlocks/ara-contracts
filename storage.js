const { abi } = require('./build/contracts/AFS.json')
const isBuffer = require('is-buffer')

const {
  web3: {
    isAddress,
    call,
    tx
  }
} = require('ara-util')

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
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  const { offsets: mtOffsets, buffer: mtBuffer } = opts.mtData
  const { offsets: msOffsets, buffer: msBuffer } = opts.msData
  const {
    account,
    to,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  const { tx: transaction, ctx } = await tx.create({
    gasLimit: 4000000,
    gasPrice,
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
    const cost = tx.estimateCost(transaction)
    ctx.close()
    return cost
  }

  const receipt = await tx.sendSignedTransaction(transaction, {
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  })
  ctx.close()
  return receipt
}

async function hasBuffer(opts) {
  _validateOpts(opts)

  if (!opts.buffer || ('string' !== typeof opts.buffer && false === isBuffer(opts.buffer))) {
    throw new TypeError('Expecting valid hex string for opts.buffer')
  }

  if (isBuffer(opts.buffer)) {
    opts.buffer = `0x${opts.buffer.toString('hex')}`
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

async function isEmpty(address = '') {
  if (!address || 'string' !== typeof address) {
    throw new TypeError('Expecting address to be non-empty string')
  }

  if (!isAddress(address)) {
    throw new Error(`${address} is not a valid Ethereum address`)
  }

  let empty = true
  try {
    // only need to check first header
    const buf = await read({
      fileIndex: 0,
      offset: 0,
      address
    })
    empty = null === buf
  } catch (err) {
    throw err
  }
  return empty
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
  isEmpty,
  write,
  read
}
