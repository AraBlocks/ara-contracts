const { createIdentityKeyPath } = require('ara-identity')
const { blake2b } = require('ara-crypto')
const mirror = require('mirror-folder')
const { readFile } = require('fs')
const mkdirp = require('mkdirp')
const pify = require('pify')

const {
  resolve,
  parse
} = require('path')

module.exports = {

  async mirrorIdentity(testDID) {
    const publicKey = Buffer.from(testDID, 'hex')
    const hash = blake2b(publicKey).toString('hex')
    const path = `${__dirname}/fixtures/identities`
    const ddoPath = resolve(path, hash, 'ddo.json')
    const ddo = JSON.parse(await pify(readFile)(ddoPath, 'utf8'))
    const identityPath = createIdentityKeyPath(ddo)
    const parsed = parse(identityPath)
    await pify(mkdirp)(parsed.dir)
    await pify(mirror)(resolve(path, hash), identityPath)
    return { ddo, did: testDID }
  }

}
