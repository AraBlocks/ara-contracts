/* eslint-disable no-await-in-loop */

const { abi: tokenAbi } = require('./build/contracts/ARAToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { kARATokenAddress } = require('./constants')
const account = require('ara-web3/account')
const { call } = require('ara-web3/call')
const { info } = require('ara-console')
const tx = require('ara-web3/tx')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

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

  const acct = await account.get({ did, password })

  try {
    await checkLibrary(did, contentDid)

    if (await proxyExists(contentDid)) {
      throw new Error('ara-contracts.purchase: This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const price = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'price_'
    })

    const approveTx = await tx.create({
      account: acct,
      to: kARATokenAddress,
      data: {
        tokenAbi,
        functionName: 'approve',
        values: [
          proxy,
          price
        ]
      }
    })

    await tx.sendSignedTransaction(approveTx)

    const purchaseTx = await tx.create({
      account: acct,
      to: proxy,
      data: {
        afsAbi,
        functionName: 'purchase',
        values: [
          hIdentity,
          true
        ]
      }
    })
    await tx.sendSignedTransaction(purchaseTx)

    const size = await getLibrarySize(did)

    const contentId = await getLibraryItem(did, size - 1)

    info(contentId, `added to library (${size})`)
  } catch (err) {
    throw err
  }
}

module.exports = {
  purchase
}
