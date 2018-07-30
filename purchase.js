/* eslint-disable no-await-in-loop */

const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { web3 } = require('ara-context')()
const { info } = require('ara-console')

const {
  checkLibrary,
  getLibrarySize,
  getLibraryItem
} = require('./library')

const {
  kAfsAddress,
  kLibraryAddress
} = require('./constants')

const {
  hashIdentity,
  normalize
} = require('./util')

async function purchase({
  requesterDid = '',
  contentDid = '',
  price = -1
} = {}) {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty requester DID')
  }

  if (null == contentDid || 'string' !== typeof contentDid || !contentDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty content DID')
  }

  requesterDid = normalize(requesterDid)
  contentDid = normalize(contentDid)

  debug(requesterDid, 'purchasing', contentDid, 'for', price)

  const hIdentity = hashIdentity(requesterDid)
  const hContentIdentity = hashIdentity(contentDid)

  const accounts = await web3.eth.getAccounts()
  const afsDeployed = new web3.eth.Contract(afsAbi, kAfsAddress)

  try {
    await checkLibrary(requesterDid, contentDid)
  } catch (err) {
    throw err
  }

  // call token contract to approve

  await afsDeployed.methods.purchase(hIdentity, true).send({
    from: accounts[0],
    gas: 500000
  })

  const size = await getLibrarySize(requesterDid)

  const contentId = await getLibraryItem(requesterDid, size - 1)

  info(contentId, `added to library (${size})`)
}

module.exports = {
  purchase,
  setPurchaseDelegates
}
