/* eslint-disable no-await-in-loop */

const { abi: libAbi } = require('./build/contracts/Library.json')
const { abi: proxyAbi } = require('./build/contracts/AFS.json')
const { LIBRARY_ADDRESS } = require('./constants')
const { getProxyAddress } = require('./registry')

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

  requesterDid = normalize(requesterDid)

  const libSize = await getLibrarySize(requesterDid)
  const lib = []
  for (let i = 0; i < libSize; i++) {
    const item = await getLibraryItem({ requesterDid, index: i })
    lib.push(item)
  }
  return lib
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
 * Gets the DID of the item at index in requesterDid's library
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {int}    opts.index
 * @return {string}
 * @throws {Error, TypeError}
 */
async function getLibraryItem(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('number' !== typeof opts.index || opts.index < 0) {
    throw TypeError('Expecting a whole number index')
  }

  const { requesterDid, index } = opts
  const hIdentity = hashDID(requesterDid)

  if (await getLibrarySize(requesterDid) <= index) {
    throw Error('Invalid index')
  }

  return call({
    abi: libAbi,
    address: LIBRARY_ADDRESS,
    functionName: 'getLibraryItem',
    arguments: [
      ethify(hIdentity),
      index
    ]
  })
}

/**
 * Checks whether a user has purchased an AFS.
 * @param  {Object}  opts
 * @param  {String}  opts.purchaserDid
 * @param  {String}  opts.contentDid
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
  const proxy = await getProxyAddress(contentDid)
  let purchaser = await getAddressFromDID(purchaserDid)

  if (!isAddress(purchaser)) {
    // TODO(cckelly) convert all ara-contracts errors to this style
    throw new Error(`${purchaserDid} did not resolve to a valid Ethereum address. Got ${purchaser}. Ensure ${purchaserDid} is a valid Ara identity.`)
  }

  purchaser = sha3(purchaser)

  return call({
    abi: proxyAbi,
    address: proxy,
    functionName: 'purchasers_',
    arguments: [ purchaser ]
  })
}

module.exports = {
  getLibrarySize,
  getLibraryItem,
  hasPurchased,
  getLibrary
}
