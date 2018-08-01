const hasDIDMethod = require('has-did-method')
const { blake2b } = require('ara-crypto')

const {
  kAidPrefix,
  kDidPrefix,
  kOwnerSuffix
} = require('./constants')

function hashIdentity(did) {
  return blake2b(Buffer.from(did, 'hex')).toString('hex')
}

function normalize(did) {
  if (hasDIDMethod(did)) {
    if (0 !== did.indexOf(kAidPrefix)) {
      throw new TypeError('Expecting a DID URI with an "ara" method.')
    } else {
      did = did.substring(kAidPrefix.length)
      if (64 !== did.length) {
        throw new Error('DID is not 64 characters')
      }
    }
  }
  return did
}

function getDocumentOwner(ddo, shouldNormalize = true) {
  if (!ddo || null == ddo || 'object' !== typeof ddo) {
    throw new TypeError('Expecting DDO')
  }

  let pk
  if (ddo.authentication) {
    pk = ddo.authentication[0].authenticationKey
  } else if (ddo.didDocument) {
    pk = ddo.didDocument.authentication[0].authenticationKey
  }

  const suffixLength = kOwnerSuffix.length
  const id = pk.slice(0, pk.length - suffixLength)

  return shouldNormalize ? normalize(id) : id
}

module.exports = {
  getDocumentOwner,
  hashIdentity,
  normalize
}
