/* eslint-disable no-await-in-loop */

const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const account = require('ara-web3/account')
const { info } = require('ara-console')
const tx = require('ara-web3/tx')

const { kAFSAddress } = require('./constants')

const {
  checkLibrary,
  getLibrarySize,
  getLibraryItem
} = require('./library')

const {
  hashIdentity,
  normalize,
  validate
} = require('./util')

/**
 * Purchase contentDid
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @throws {Error,TypeError}
 */
async function purchase(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.library: Expecting opts object.')
  } else if (null == opts.requesterDid || 'string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty requester DID')
  } else if (null == opts.contentDid || 'string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty content DID')
  } else if (null == opts.password || 'string' != typeof opts.password || !opts.assword) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty password')
  }

  const { requesterDid, password } = opts
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'purchase' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did, 'purchasing', contentDid)

  const hIdentity = hashIdentity(did)
  const hContentIdentity = hashIdentity(contentDid)

  const acct = await account.get({ did, password })

  try {
    await checkLibrary(did, contentDid)
  } catch (err) {
    throw err
  }

  // (1) call token contract to approve

  // (2) ask registry for proxy

  const transaction = await tx.create({
    account: acct,
    // change to proxy
    to: kAFSAddress,
    data: {
      afsAbi,
      functionName: 'purchase',
      values: [
        hIdentity,
        true
      ]
    }
  })
  await tx.sendSignedTransaction(transaction)

  const size = await getLibrarySize(did)

  const contentId = await getLibraryItem(did, size - 1)

  info(contentId, `added to library (${size})`)
}

module.exports = {
  purchase
}
