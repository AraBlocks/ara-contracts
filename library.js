/* eslint-disable no-await-in-loop */

const { abi } = require('./build/contracts/Library.json')
const { kLibraryAddress } = require('./constants')
const { call } = require('ara-web3/call')

const {
  hashIdentity,
  normalize
} = require('./util')

/**
 * Returns requesterDid's library
 * @return {Array}
 * @throws {TypeError}
 */
async function getLibrary(requesterDid = '') {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  return checkLibrary(requesterDid)
}

/**
 * Checks to see if contentDid is in the requesterDid's library
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @return {Array}
 * @throws {Error,TypeError}
 */
async function checkLibrary(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.library: Expecting opts object.')
  } else if (null == opts.requesterDid || 'string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  } else if (null == opts.contentDid || 'string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  let { requesterDid, contentDid } = opts

  requesterDid = normalize(requesterDid)
  contentDid = normalize(contentDid)

  const libSize = await getLibrarySize(requesterDid)
  const lib = []
  for (let i = 0; i < libSize; i++) {
    const item = await getLibraryItem(requesterDid, i)
    if (contentDid && item == contentDid) {
      throw new Error('Item is already in user library and cannot be purchased again')
    }
    lib.push(item)
  }
  return lib
}

/**
 * Gets the size of requesterDid's library
 * @param  {String} requesterDid
 * @return {int}
 * @throws {TypeError}
 */
async function getLibrarySize(requesterDid = '') {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  requesterDid = normalize(requesterDid)
  const hIdentity = hashIdentity(requesterDid)

  return call({
    abi,
    address: kLibraryAddress,
    functionName: 'getLibrarySize',
    arguments: [
      hIdentity
    ]
  })
}

/**
 * Gets the address of the item at index in requesterDid's library
 * @param  {String} requesterDid
 * @param  {int} index
 * @return {string}
 * @throws {Error, TypeError}
 */
async function getLibraryItem(requesterDid = '', index = -1) {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  if (index < 0) {
    throw Error('ara-contracts.library: Expecting a whole number index')
  }

  requesterDid = normalize(requesterDid)
  const hIdentity = hashIdentity(requesterDid)

  if (await getLibrarySize(requesterDid) <= index) {
    throw Error('ara-contracts.library: Invalid index')
  }

  return call({
    abi,
    address: kLibraryAddress,
    functionName: 'getLibraryItem',
    arguments: [
      hIdentity,
      index
    ]
  })
}

module.exports = {
  getLibrary,
  checkLibrary,
  getLibrarySize,
  getLibraryItem
}
