/* eslint-disable no-await-in-loop */

const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const account = require('ara-web3/account')
const { info } = require('ara-console')
const tx = require('ara-web3/tx')

const {
  kAfsAddress,
  kLibraryAddress
} = require('./constants')

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

async function purchase({
  requesterDid = '',
  contentDid = '',
  password = '',
  price = -1
} = {}) {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty requester DID')
  } else if (null == contentDid || 'string' !== typeof contentDid || !contentDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty content DID')
  } else if (null == password || 'string' != typeof password || !password) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty password')
  }

  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'purchase' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did, 'purchasing', contentDid, 'for', price)

  const hIdentity = hashIdentity(did)
  const hContentIdentity = hashIdentity(contentDid)

  const acct = await account.get({ did, password })
  const afsDeployed = new web3.eth.Contract(afsAbi, kAfsAddress)

  try {
    await checkLibrary(did, contentDid)
  } catch (err) {
    throw err
  }

  // (1) call token contract to approve

  // (2) ask registry for proxy

  const transaction = await tx.create({
    account: acct,
    to: kAFSAddress, // change to proxy
    data: {
      afsAbi,
      name: 'purchase',
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
  purchase,
  setPurchaseDelegates
}
