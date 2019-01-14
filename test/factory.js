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
  replaceVersions,
  mirrorIdentity,
  resetVersions,
  replaceNames,
  resetNames
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

test.serial('deployAraContracts()', async (t) => {
  const masterDid = getDid(t)

  await replaceVersions()
  await replaceNames()

  await t.notThrowsAsync(factory.compileAraContracts())
  await t.notThrowsAsync(factory.deployAraContracts({ masterDid, password }))

  const latestRegistryAddress = await factory.getLatestVersionAddress(constants.REGISTRY_NAME)
  const registryAddress = await factory.getUpgradeableContractAddress(constants.REGISTRY_NAME, constants.REGISTRY_VERSION)
  t.is(latestRegistryAddress, registryAddress)

  const latestLibraryAddress = await factory.getLatestVersionAddress(constants.LIBRARY_NAME)
  const libraryAddress = await factory.getUpgradeableContractAddress(constants.LIBRARY_NAME, constants.LIBRARY_VERSION)
  t.is(latestLibraryAddress, libraryAddress)

  const latestTokenAddress = await factory.getLatestVersionAddress(constants.TOKEN_NAME)
  const tokenAddress = await factory.getUpgradeableContractAddress(constants.TOKEN_NAME, constants.TOKEN_VERSION)
  t.is(latestTokenAddress, tokenAddress)

  await resetVersions()
  await resetNames()
})
