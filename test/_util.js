const { getAddressFromDID, getIdentifier } = require('ara-util')
const { createIdentityKeyPath } = require('ara-identity')
const { transfer, modifyDeposit } = require('../token')
const createContext = require('ara-context')
const { blake2b } = require('ara-crypto')
const mirror = require('mirror-folder')
const { readFile } = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const pify = require('pify')

const {
  TEST_OWNER_DID,
  TEST_OWNER_ADDRESS,
  PASSWORD
} = require('./_constants')

const {
  resolve,
  parse
} = require('path')

module.exports = {

  async mirrorIdentity(testDID) {
    testDID = getIdentifier(testDID)
    const publicKey = Buffer.from(testDID, 'hex')
    const hash = blake2b(publicKey).toString('hex')
    const path = `${__dirname}/fixtures/identities`
    const ddoPath = resolve(path, hash, 'ddo.json')
    const ddo = JSON.parse(await pify(readFile)(ddoPath, 'utf8'))
    const identityPath = createIdentityKeyPath(ddo)
    const parsed = parse(identityPath)
    await pify(mkdirp)(parsed.dir)
    await pify(mirror)(resolve(path, hash), identityPath)
    return { ddo, did: testDID, identityPath }
  },

  async cleanup(account) {
    if (account && account.identityPath) {
      await pify(rimraf)(account.identityPath)
    }
  },

  async sendEthAraAndDeposit(testDID) {
    await transfer({
      to: testDID,
      val: '100',
      did: TEST_OWNER_DID,
      password: PASSWORD
    })

    const ctx = createContext()
    await ctx.ready()
    const { web3 } = ctx
    const address = await getAddressFromDID(testDID)
<<<<<<< 6cb14ffaeed19f76d5d8646f79e383fddf50373a
    await web3.eth.sendTransaction({ from: TEST_OWNER_ADDRESS, to: address, value: 2000000000000000000 })
=======
    await web3.eth.sendTransaction({ from: TEST_OWNER_ADDRESS, to: address, value: 1000000000000000000 })
>>>>>>> test(): allocate test
    ctx.close()

    await modifyDeposit({
      did: testDID,
      password: PASSWORD,
      val: '100'
    })
  }
}
