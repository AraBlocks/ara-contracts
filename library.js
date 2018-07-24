/* eslint-disable no-await-in-loop */

const { abi: libAbi } = require('./build/contracts/Library.json')
const { kLibraryAddress } = require('./constants')
const { web3 } = require('ara-context')()

const {
  hashIdentity,
  normalize
} = require('./util')

async function getLibrary(requesterDid = '') {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  return checkLibrary(requesterDid)
}

async function checkLibrary(requesterDid = '', contentDid = '') {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  requesterDid = normalize(requesterDid)
  contentDid = normalize(contentDid)
  const hIdentity = hashIdentity(requesterDid)

  const libDeployed = new web3.eth.Contract(libAbi, kLibraryAddress)
  const libSize = await libDeployed.methods.getLibrarySize(hIdentity).call()
  const lib = []
  for (let i = 0; i < libSize; i++) {
    const item = await libDeployed.methods.getLibraryItem(hIdentity, i).call()
    if (contentDid && item == contentDid) {
      throw new Error('Item is already in user library and cannot be purchased again')
    }
    lib.push(item)
  }
  return lib
}

async function getLibrarySize(requesterDid = '') {
  if (null == requesterDid || 'string' !== typeof requesterDid || !requesterDid) {
    throw TypeError('ara-contracts.library: Expecting non-empty requester DID')
  }

  requesterDid = normalize(requesterDid)
  const hIdentity = hashIdentity(requesterDid)

  const libDeployed = new web3.eth.Contract(libAbi, kLibraryAddress)
  return libDeployed.methods.getLibrarySize(hIdentity).call()
}

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

  const libDeployed = new web3.eth.Contract(libAbi, kLibraryAddress)
  return libDeployed.methods.getLibraryItem(hIdentity, index).call()
}

module.exports = {
  getLibrary,
  checkLibrary,
  getLibrarySize,
  getLibraryItem
}
