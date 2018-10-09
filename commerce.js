const { abi } = require('./build/contracts/AFS.json')
const hasDIDMethod = require('has-did-method')
const { AID_PREFIX } = require('./constants')

const {
  getAddressFromDID,
  getDocumentOwner,
  normalize,
  validate,
  web3: {
    isAddress,
    account,
    tx
  }
} = require('ara-util')

const {
  getProxyAddress,
  proxyExists
} = require('./registry')

/**
 * Requests ownership of an AFS.
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {String} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function requestOwnership(opts) {
  return _updateOwnershipRequest(opts, 'requestOwnership')
}

/**
 * Revokes a previous ownership request of an AFS.
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {String} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function revokeOwnershipRequest(opts) {
  return _updateOwnershipRequest(opts, 'revokeOwnershipRequest')
}

/**
 * Approves an ownership transfer request.
 * This officially transfers ownership for the given AFS.
 * @param  {Object}  opts
 * @param  {String}  opts.did
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function approveOwnershipTransfer(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.newOwnerDid || 'string' !== typeof opts.newOwnerDid) {
    throw new TypeError('Expecting non-empty new owner DID')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  }

  const {
    did,
    password,
    newOwnerDid,
    keyringOpts
  } = opts

  let ownerAddress
  let newOwnerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did,
      password,
      label: 'approveOwnershipTransfer',
      keyringOpts
    }))
    ownerAddress = await getAddressFromDID(normalize(did))
    newOwnerAddress = await getAddressFromDID(normalize(newOwnerDid))
  } catch (err) {
    throw err
  }

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  if (!isAddress(newOwnerAddress)) {
    throw new Error(`opts.newOwnerDid did not resolve to a valid Ethereum address.
      Ensure ${newOwnerDid} is a valid Ara identity.`)
  }

  if (!(await proxyExists(did))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  const acct = await account.load({ did: owner, password })
  const approveTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName: 'approveOwnershipTransfer',
      values: [ newOwnerAddress ]
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(approveTx)
  }

  return tx.sendSignedTransaction(approveTx)
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
  }

  const {
    keyringOpts,
    contentDid,
    password
  } = opts
  let { requesterDid } = opts

  let requesterAddress
  try {
    await validate({ did: requesterDid, password, label: functionName, keyringOpts })
    requesterAddress = await getAddressFromDID(normalize(requesterDid))
  } catch (err) {
    throw err
  }

  if (!isAddress(requesterAddress)) {
    throw new Error(`opts.requesterDid did not resolve to a valid Ethereum address. 
      Ensure ${requesterDid} is a valid Ara identity.`)
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  if (!hasDIDMethod(requesterDid)) {
    requesterDid = `${AID_PREFIX}${requesterDid}`
  }

  const acct = await account.load({ did: requesterDid, password })
  const requestTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(requestTx)
  }

  return tx.sendSignedTransaction(requestTx)
}

module.exports = {
  approveOwnershipTransfer,
  revokeOwnershipRequest,
  requestOwnership
}
