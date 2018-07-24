/* eslint-disable no-await-in-loop */

const { abi: purchaseAbi } = require('./build/contracts/Purchase.json')
const debug = require('debug')('ara-contracts:purchase')
const { web3 } = require('ara-context')()
const { info } = require('ara-console')

const {
  checkLibrary,
  getLibrarySize,
  getLibraryItem
} = require('./library')

const {
  kPriceAddress,
  kPurchaseAddress,
  kLibraryAddress
} = require('./constants')

const {
  hashIdentity,
  normalize
} = require('./util')

async function setPurchaseDelegates({
  priceAddress = kPriceAddress,
  libAddress = kLibraryAddress
} = {}) {
  if (null == priceAddress || 'string' !== typeof priceAddress || !priceAddress) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty price address')
  }

  if (null == libAddress || 'string' !== typeof libAddress || !libAddress) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty library address')
  }

  const accounts = await web3.eth.getAccounts()
  const purchaseDeployed = new web3.eth.Contract(purchaseAbi, kPurchaseAddress)

  await purchaseDeployed.methods.setDelegateAddresses(kPriceAddress, kLibraryAddress).send({
    from: accounts[0],
    gas: 500000
  })

  debug('price contract address set to:', priceAddress)
  debug('library contract address set to:', libAddress)
}

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
  const purchaseDeployed = new web3.eth.Contract(purchaseAbi, kPurchaseAddress)

  try {
    await checkLibrary(requesterDid, contentDid)
  } catch (err) {
    throw err
  }

  await purchaseDeployed.methods.purchase(hIdentity, contentDid, hContentIdentity, price).send({
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
