const { abi } = require('./build/contracts/AFS.json')

const {
  getAddressFromDID,
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
 * Approves a pending staged transfer.
 * This officially transfers ownership for the given AFS.
 * @param  {Object}  opts
 * @param  {String}  opts.did
 * @param  {String}  opts.password
 * @param  {String}  opts.contentDid
 * @param  {Boolean} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function approveOwnershipTransfer(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty staged owner DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  }

  const {
    did,
    password,
    contentDid,
  } = opts

  let stagedOwnerAddress
  try {
    await validate({ did, password, label: 'approveOwnershipTransfer' })
    stagedOwnerAddress = await getAddressFromDID(normalize(did))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  if (!isAddress(stagedOwnerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  const proxy = await getProxyAddress(contentDid)
  const acct = await account.load({ did, password })
  const approveTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName: 'approveOwnershipTransfer'
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(approveTx)
  }

  return tx.sendSignedTransaction(approveTx)
}

/**
 * Stages the transfer of an AFS to another identity.
 * The identity the transfer was staged for must approve the transfer.
 * @param  {Object}  opts
 * @param  {String}  opts.ownerDid
 * @param  {String}  opts.password
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.newOwnerDid
 * @param  {Boolean} opts.estimate
 * @return {Object}
 */
async function stageOwnershipTransfer(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.ownerDid || 'string' !== typeof opts.ownerDid) {
    throw new TypeError('Expecting non-empty owner DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  } else if (!opts.newOwnerDid || 'string' !== typeof opts.newOwnerDid) {
    throw new TypeError('Expecting non-empty new owner DID')
  }

  const {
    newOwnerDid,
    contentDid,
    password,
    ownerDid
  } = opts

  let ownerAddress
  let newOwnerAddress
  try {
    await validate({ did: ownerDid, password, label: 'stageOwnershipTransfer' })
    ownerAddress = await getAddressFromDID(normalize(ownerDid))
    newOwnerAddress = await getAddressFromDID(normalize(newOwnerDid))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.ownerDid did not resolve to a valid Ethereum address. 
      Ensure ${ownerDid} is a valid Ara identity.`)
  }

  if (!isAddress(newOwnerAddress)) {
    throw new Error(`opts.newOwnerDid did not resolve to a valid Ethereum address. 
      Ensure ${newOwnerDid} is a valid Ara identity.`)
  }

  const proxy = await getProxyAddress(contentDid)
  const acct = await account.load({ did: ownerDid, password })
  const stageTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName: 'stageOwnershipTransfer',
      values: [ newOwnerAddress ]
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(stageTx)
  }

  return tx.sendSignedTransaction(stageTx)
}

module.exports = {
  approveOwnershipTransfer,
  stageOwnershipTransfer
}
