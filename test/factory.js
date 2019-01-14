const constants = require('../constants')
const factory = require('../factory')
const pify = require('pify')
const path = require('path')
const test = require('ava')
const fs = require('fs')

const {
  TEST_OWNER_DID_NO_METHOD,
  PASSWORD: password,
  BYTESDIR
} = require('./_constants')

const {
  cleanupAndResetBytesPath,
  replaceBytesPath,
  mirrorIdentity
} = require('./_util')

const getDid = (t) => {
  const { did } = t.context.defaultAccount
  return did
}

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  await replaceBytesPath()
})

test.after(async () => {
  await cleanupAndResetBytesPath()
})

test.serial('compileAraContracts()', async (t) => {
  await t.notThrowsAsync(factory.compileAraContracts())

  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Registry_${constants.REGISTRY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Library_${constants.LIBRARY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Token_${constants.TOKEN_VERSION}`)))
})

test.serial('deployAraContracts() invalid opts', async (t) => {
  const masterDid = getDid(t)

  await t.throwsAsync(factory.deployAraContracts(), TypeError)
  await t.throwsAsync(factory.deployAraContracts('opts'), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ }), TypeError)

  await t.throwsAsync(factory.deployAraContracts({ masterDid }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ password }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ masterDid: '' }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ password: '' }), TypeError)

  await t.throwsAsync(factory.deployAraContracts({ masterDid: '', password }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ masterDid: 'did:ara:invalid', password }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ masterDid: true, password }), TypeError)

  await t.throwsAsync(factory.deployAraContracts({ masterDid, password: '' }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ masterDid, password: 123 }), TypeError)
  await t.throwsAsync(factory.deployAraContracts({ masterDid, password: true }), TypeError)
})

test.serial('deployAraContracts() version already deployed', async (t) => {
  const masterDid = getDid(t)

  await t.throwsAsync(factory.deployAraContracts({ masterDid, password }), Error)
})

// test.serial('deployAraContracts()', async (t) => {
//   const masterDid = getDid(t)

//   await t.notThrowsAsync(factory.deployAraContracts({ masterDid, password }))

//   const latestVersionAddress = await factory.getLatestVersionAddress(constants.REGISTRY_LABEL)
//   const address = await factory.getUpgradeableContractAddress(constants.REGISTRY_LABEL, constants.REGISTRY_VERSION)
//   t.is(latestVersionAddress, address)
// })
