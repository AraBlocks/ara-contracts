/* eslint-disable no-await-in-loop */

const { abi: libAbi } = require('./build/contracts/Library.json')
const { abi: proxyAbi } = require('./build/contracts/AFS.json')
const { LIBRARY_ADDRESS } = require('./constants')
const util = require('util')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  hashDID,
  normalize,
  web3: {
    sha3,
    call,
    ethify,
    isAddress
  },
  getAddressFromDID
} = require('ara-util')

/**
 * Returns requesterDid's library
 * @param  {string} unhashed did
 * @return {Array}
 * @throws {TypeError}
 */
async function getLibrary(requesterDid = '') {
  if (!requesterDid || 'string' !== typeof requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  }

  const hIdentity = hashDID(requesterDid)

  return call({
    abi: libAbi,
    address: LIBRARY_ADDRESS,
    functionName: 'getLibrary',
    arguments: [
      ethify(hIdentity)
    ]
  })
}

/**
 * Gets the size of requesterDid's library
 * @param  {String} unhashd requesterDid
 * @return {int}
 * @throws {TypeError}
 */
async function getLibrarySize(requesterDid = '') {
  if ('string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  }

  const hIdentity = hashDID(requesterDid)

  return call({
    abi: libAbi,
    address: LIBRARY_ADDRESS,
    functionName: 'getLibrarySize',
    arguments: [
      ethify(hIdentity)
    ]
  })
}

/**
 * Checks whether a user has purchased an AFS.
 * @param  {Object}  opts
 * @param  {String}  opts.purchaserDid
 * @param  {String}  opts.contentDid
 * @param  {Object} [opts.keyringOpts]
 * @return {Boolean}      [description]
 */
async function hasPurchased(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if (!opts.purchaserDid || 'string' !== typeof opts.purchaserDid) {
    throw new TypeError('Expecting non-empty string for purchaser DID')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty string for content DID')
  }

  const { purchaserDid, contentDid } = opts
  const hIdentity = hashDID(purchaserDid)
  contentDid = normalize(contentDid)

  return call({
    abi: libAbi,
    address: LIBRARY_ADDRESS,
    functionName: 'owns',
    arguments: [
      ethify(hIdentity),
      ethify(contentDid)
    ]
  })

}

/**
 * Gets number of copies of an AFS a purchaser owns.
 * @param  {Object}  opts
 * @param  {String}  opts.purchaserDid
 * @param  {String}  opts.contentDid
 * @return {Boolean}      [description]
 */
async function getNumberCopiesOwned(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if (!opts.purchaserDid || 'string' !== typeof opts.purchaserDid) {
    throw new TypeError('Expecting non-empty string for purchaser DID')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty string for content DID')
  }

  const { purchaserDid, contentDid, keyringOpts } = opts
  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)
  const purchaser = await getAddressFromDID(purchaserDid, keyringOpts)

  if (!isAddress(purchaser)) {
    // TODO(cckelly) convert all ara-contracts errors to this style
    throw new Error(`opts.purchaserDid did not resolve to a valid Ethereum address. Got ${purchaser}. Ensure ${purchaserDid} is a valid Ara identity.`)
  }

  const { quantity } = await call({
    abi: proxyAbi,
    address: proxy,
    functionName: 'purchasers_',
    arguments: [
      sha3({ t: 'address', v: purchaser })
    ]
  })

  return quantity
}

module.exports = {
  getNumberCopiesOwned,
  getLibrarySize,
  hasPurchased,
  getLibrary
}

module.exports.getLibraryItem = util.deprecate(() => {}, 'getLibraryItem() is deprecated. Use getLibrary() instead.')
