const { abi } = require('./build/contracts/AFS.json')
const hasDIDMethod = require('has-did-method')
const { AID_PREFIX } = require('./constants')

const {
  getAddressFromDID,
  getDocumentOwner,
  getIdentifier,
  validate,
  web3: {
    account,
    call,
    sha3,
    tx
  }
} = require('ara-util')

const {
  getProxyAddress,
  proxyExists
} = require('./registry')

/**
 * Gets the address of the owner of an AFS
 * @param  {String} contentDid
 * @throws {Error|TypeError}
 * @return {String}
 */
async function getOwner(contentDid) {
  if (!contentDid || 'string' !== typeof contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  }

  contentDid = getIdentifier(contentDid)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('Content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const address = await call({
      abi,
      address: proxy,
      functionName: 'owner_'
    })
    return address
  } catch (err) {
    throw err
  }
}

/**
 * Checks if a DID has requested ownership of an AFS
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {Object} [opts.keyringOpts]
 * @throws {Error|TypeError}
 * @return {Boolean}
 */
async function hasRequested(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  }

  const { keyringOpts } = opts
  let { requesterDid, contentDid } = opts
  requesterDid = getIdentifier(requesterDid)
  contentDid = getIdentifier(contentDid)

  const requesterAddress = await getAddressFromDID(requesterDid, keyringOpts)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const requested = await call({
      abi,
      address: proxy,
      functionName: 'requesters_',
      arguments: [
        sha3(requesterAddress)
      ]
    })
    return requested
  } catch (err) {
    throw err
  }
}

/**
 * Requests ownership of an AFS.
 * @param  {Object}   opts
 * @param  {String}   opts.requesterDid
 * @param  {String}   opts.contentDid
 * @param  {String}   opts.password
 * @param  {String}   opts.estimate
 * @param  {Object}   [opts.keyringOpts]
 * @param  {Number}   [opts.gasPrice]
 * @param  {Function} [opts.onhash]
 * @param  {Function} [opts.onreceipt]
 * @param  {Function} [opts.onconfirmation]
 * @param  {Function} [opts.onerror]
 * @param  {Function} [opts.onmined]
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function requestOwnership(opts) {
  return _updateOwnershipRequest(opts, 'requestOwnership')
}

/**
 * Revokes an outstanding ownership request of an AFS.
 * @param  {Object}   opts
 * @param  {String}   opts.requesterDid
 * @param  {String}   opts.contentDid
 * @param  {String}   opts.password
 * @param  {String}   opts.estimate
 * @param  {Object}   [opts.keyringOpts]
 * @param  {Number}   [opts.gasPrice]
 * @param  {Function} [opts.onhash]
 * @param  {Function} [opts.onreceipt]
 * @param  {Function} [opts.onconfirmation]
 * @param  {Function} [opts.onerror]
 * @param  {Function} [opts.onmined]
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function revokeOwnershipRequest(opts) {
  return _updateOwnershipRequest(opts, 'revokeOwnershipRequest')
}

/**
 * Approves an ownership transfer request.
 * This officially transfers ownership for the given AFS.
 * @param  {Object}   opts
 * @param  {String}   opts.contentDid
 * @param  {String}   opts.newOwnerDid
 * @param  {String}   opts.password
 * @param  {String}   opts.afsPassword
 * @param  {Boolean}  opts.estimate
 * @param  {Object}   [opts.keyringOpts]
 * @param  {Number}   [opts.gasPrice]
 * @param  {Function} [opts.onhash]
 * @param  {Function} [opts.onreceipt]
 * @param  {Function} [opts.onconfirmation]
 * @param  {Function} [opts.onerror]
 * @param  {Function} [opts.onmined]
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function approveOwnershipTransfer(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (!opts.newOwnerDid || 'string' !== typeof opts.newOwnerDid) {
    throw new TypeError('Expecting non-empty new owner DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (opts.afsPassword && 'string' !== typeof opts.afsPassword) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  const {
    contentDid,
    password,
    newOwnerDid,
    keyringOpts,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  let { afsPassword } = opts

  afsPassword = afsPassword || password

  let newOwnerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did: contentDid,
      password: afsPassword,
      label: 'approveOwnershipTransfer',
      keyringOpts
    }))
    newOwnerAddress = await getAddressFromDID(getIdentifier(newOwnerDid))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  const acct = await account.load({ did: owner, password })
  const { tx: approveTx, ctx } = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    gasPrice,
    data: {
      abi,
      functionName: 'approveOwnershipTransfer',
      values: [ newOwnerAddress ]
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    const cost = tx.estimateCost(approveTx)
    ctx.close()
    return cost
  }

  const receipt = await tx.sendSignedTransaction(approveTx, { onhash, onreceipt, onconfirmation, onerror, onmined })
  ctx.close()
  return receipt
}

async function _updateOwnershipRequest(opts, functionName = '') {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (!opts.requesterDid || 'string' !== typeof opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  const {
    keyringOpts,
    contentDid,
    password,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts
  let { requesterDid } = opts

  try {
    await validate({
      label: functionName,
      did: requesterDid,
      keyringOpts,
      password
    })
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  if (!hasDIDMethod(requesterDid)) {
    requesterDid = `${AID_PREFIX}${requesterDid}`
  }

  const acct = await account.load({ did: requesterDid, password })
  const { tx: requestTx, ctx } = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    gasPrice,
    data: {
      abi,
      functionName
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    const cost = tx.estimateCost(requestTx)
    ctx.close()
    return cost
  }

  const receipt = await tx.sendSignedTransaction(requestTx, { onhash, onreceipt, onconfirmation, onerror, onmined })
  ctx.close()
  return receipt
}

module.exports = {
  approveOwnershipTransfer,
  revokeOwnershipRequest,
  requestOwnership,
  hasRequested,
  getOwner
}
