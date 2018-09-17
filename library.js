/* eslint-disable no-await-in-loop */

const { abi } = require('./build/contracts/Library.json')
const { kLibraryAddress } = require('./constants')

const {
  hashDID,
  normalize,
  web3: {
    call,
    ethify
  }
} = require('ara-util')

/**
 * Returns requesterDid's library
 * @param  {string} unhashed did
 * @return {Array}
 * @throws {TypeError}
 */
async function getLibrary(requesterDid = '') {
  if ('string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  }

  return checkLibrary({ requesterDid })
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
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if (opts.contentDid && 'string' !== typeof opts.contentDid) {
    throw TypeError('Expecting valid content DID')
  }

  let { requesterDid, contentDid } = opts

  requesterDid = normalize(requesterDid)
  if (contentDid) {
    contentDid = normalize(contentDid)
  }

  const libSize = await getLibrarySize(requesterDid)
  const lib = []
  for (let i = 0; i < libSize; i++) {
    opts = { requesterDid, index: i }
    const item = await getLibraryItem(opts)
    if (contentDid && item == ethify(contentDid)) {
      throw new Error('Item is already in user library and cannot be purchased again')
    }
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
    abi,
    address: kLibraryAddress,
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
    abi,
    address: kLibraryAddress,
    functionName: 'getLibraryItem',
    arguments: [
      ethify(hIdentity),
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
