const { getAddressFromDID, getIdentifier } = require('ara-util')
const { createIdentityKeyPath } = require('ara-identity')
const createContext = require('ara-context')
const replace = require('replace-in-file')
const { blake2b } = require('ara-crypto')
const mirror = require('mirror-folder')
const { readFile } = require('fs')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const pify = require('pify')

const {
  resolve,
  parse
} = require('path')
const {
  TEST_OWNER_DID,
  TEST_OWNER_ADDRESS,
  PASSWORD,
  BYTESDIR
} = require('./_constants')

const constants = require('../constants')
const { transfer, modifyDeposit } = require('../token')

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
    await mkdirp(parsed.dir)
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
    await web3.eth.sendTransaction({ from: TEST_OWNER_ADDRESS, to: address, value: 2000000000000000000 })
    ctx.close()

    await modifyDeposit({
      did: testDID,
      password: PASSWORD,
      val: '100'
    })
  },

  async replaceBytesPath() {
    const constantsPath = resolve(__dirname, '../constants.js')
    const options = {
      files: constantsPath,
      from: [ 'path.resolve(__dirname, \'./bytecode\')' ],
      to: [ 'path.resolve(__dirname, \'./bytecode_test\')' ]
    }
    await replace(options)
  },

  async cleanupAndResetBytesPath() {
    const constantsPath = resolve(__dirname, '../constants.js')
    await pify(rimraf)(BYTESDIR)

    const options = {
      files: constantsPath,
      from: [ 'path.resolve(__dirname, \'./bytecode_test\')' ],
      to: [ 'path.resolve(__dirname, \'./bytecode\')' ]
    }
    await replace(options)
  },

  async replaceVersions(versionName) {
    const constantsPath = resolve(__dirname, '../constants.js')
    const options = {
      files: constantsPath,
      from: [ `REGISTRY_VERSION: '${constants.REGISTRY_VERSION}'`, `LIBRARY_VERSION: '${constants.LIBRARY_VERSION}'`, `TOKEN_VERSION: '${constants.TOKEN_VERSION}'` ],
      to: [ `REGISTRY_VERSION: '${versionName}'`, `LIBRARY_VERSION: '${versionName}'`, `TOKEN_VERSION: '${versionName}'` ]
    }
    await replace(options)
  },

  async resetVersions(versionName) {
    const constantsPath = resolve(__dirname, '../constants.js')
    const options = {
      files: constantsPath,
      from: [ `REGISTRY_VERSION: '${versionName}'`, `LIBRARY_VERSION: '${versionName}'`, `TOKEN_VERSION: '${versionName}'` ],
      to: [ `REGISTRY_VERSION: '${constants.REGISTRY_VERSION}'`, `LIBRARY_VERSION: '${constants.LIBRARY_VERSION}'`, `TOKEN_VERSION: '${constants.TOKEN_VERSION}'` ]
    }
    await replace(options)
  },

  async replaceNames() {
    const constantsPath = resolve(__dirname, '../constants.js')
    const options = {
      files: constantsPath,
      from: [ `REGISTRY_NAME: '${constants.REGISTRY_NAME}'`, `LIBRARY_NAME: '${constants.LIBRARY_NAME}'`, `TOKEN_NAME: '${constants.TOKEN_NAME}'` ],
      to: [ 'REGISTRY_NAME: \'regname\'', 'LIBRARY_NAME: \'libname\'', 'TOKEN_NAME: \'tokenname\'' ]
    }
    await replace(options)
  },

  async resetNames() {
    const constantsPath = resolve(__dirname, '../constants.js')
    const options = {
      files: constantsPath,
      from: [ 'REGISTRY_NAME: \'regname\'', 'LIBRARY_NAME: \'libname\'', 'TOKEN_NAME: \'tokenname\'' ],
      to: [ `REGISTRY_NAME: '${constants.REGISTRY_NAME}'`, `LIBRARY_NAME: '${constants.LIBRARY_NAME}'`, `TOKEN_NAME: '${constants.TOKEN_NAME}'` ]
    }
    await replace(options)
  }
}
