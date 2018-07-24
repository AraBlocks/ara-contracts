const { blake2b } = require('ara-crypto')

const {
  kAidPrefix,
  kDidPrefix
} = require('./constants')

function hashIdentity(did) {
  return blake2b(Buffer.from(did, 'hex')).toString('hex')
}

function hasDIDMethod(did) {
  return 0 === did.indexOf(kDidPrefix)
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

module.exports = {
  hashIdentity,
  normalize
}
