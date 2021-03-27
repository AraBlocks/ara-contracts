let constants = require('../constants')
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

const funcMap = [
  factory.compileAndUpgradeRegistry,
  factory.compileAndUpgradeLibrary,
  factory.compileAndUpgradeToken,
  factory.deployAraContracts
]

const versionName1 = 'la-di-da'
const versionName2 = 'la-di-da2'

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  await replaceBytesPath()
})

test.after(async () => {
  await cleanupAndResetBytesPath()
})

test.serial('getLatestVersionAddress(label) invalid args', async (t) => {
  await t.throwsAsync(factory.getLatestVersionAddress(), {instanceOf: TypeError})
  await t.throwsAsync(factory.getLatestVersionAddress(''), {instanceOf: TypeError})
  await t.throwsAsync(factory.getLatestVersionAddress(123), {instanceOf: TypeError})
  await t.throwsAsync(factory.getLatestVersionAddress(true), {instanceOf: TypeError})
  await t.throwsAsync(factory.getLatestVersionAddress({ }), {instanceOf: TypeError})
})

test.serial('getUpgradeableContractAddress(label, version) invalid args', async (t) => {
  await t.throwsAsync(factory.getUpgradeableContractAddress(), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress(''), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress(123), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress(true), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress({ }), {instanceOf: TypeError})

  await t.throwsAsync(factory.getUpgradeableContractAddress('label', ''), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress('label', 123), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress('label', true), {instanceOf: TypeError})
  await t.throwsAsync(factory.getUpgradeableContractAddress('label', { }), {instanceOf: TypeError})
})

test.serial('compileAraContracts()', async (t) => {
  await t.notThrowsAsync(factory.compileAraContracts())

  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Registry_${constants.REGISTRY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Library_${constants.LIBRARY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Token_${constants.TOKEN_VERSION}`)))
})

test.serial('deployAraContracts()', async (t) => {
  const masterDid = getDid(t)

  await replaceVersions(versionName1)
  await replaceNames()

  await t.notThrowsAsync(factory.compileAraContracts())
  await t.notThrowsAsync(factory.deployAraContracts({ masterDid, password }))

  delete require.cache[require.resolve('../constants')]
  constants = require('../constants')

  const latestRegistryAddress = await factory.getLatestVersionAddress(constants.REGISTRY_NAME)
  const registryAddress = await factory.getUpgradeableContractAddress(constants.REGISTRY_NAME, constants.REGISTRY_VERSION)
  t.is(latestRegistryAddress, registryAddress)

  const latestLibraryAddress = await factory.getLatestVersionAddress(constants.LIBRARY_NAME)
  const libraryAddress = await factory.getUpgradeableContractAddress(constants.LIBRARY_NAME, constants.LIBRARY_VERSION)
  t.is(latestLibraryAddress, libraryAddress)

  const latestTokenAddress = await factory.getLatestVersionAddress(constants.TOKEN_NAME)
  const tokenAddress = await factory.getUpgradeableContractAddress(constants.TOKEN_NAME, constants.TOKEN_VERSION)
  t.is(latestTokenAddress, tokenAddress)

  await resetVersions(versionName1)
  await resetNames()
})

test.serial('deploy functions invalid generic opts', async (t) => {
  const masterDid = getDid(t)

  const promises = []

  for (const func of funcMap) {
    promises.push(new Promise(async (resolve) => {
      await t.throwsAsync(func(), {instanceOf: TypeError})
      await t.throwsAsync(func('opts'), {instanceOf: TypeError})
      await t.throwsAsync(func({ }), {instanceOf: TypeError})

      await t.throwsAsync(func({ masterDid }), {instanceOf: TypeError})
      await t.throwsAsync(func({ password }), {instanceOf: TypeError})
      await t.throwsAsync(func({ masterDid: '' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ password: '' }), {instanceOf: TypeError})

      await t.throwsAsync(func({ masterDid: '', password }), {instanceOf: TypeError})
      await t.throwsAsync(func({ masterDid: 'did:ara:invalid', password }), {instanceOf: TypeError})
      await t.throwsAsync(func({ masterDid: true, password }), {instanceOf: TypeError})

      await t.throwsAsync(func({ masterDid, password: '' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ masterDid, password: 123 }), {instanceOf: TypeError})
      await t.throwsAsync(func({ masterDid, password: true }), {instanceOf: TypeError})
      resolve()
    }))
  }
  await Promise.all(promises)
})

test.serial('deploy functions already deployed', async (t) => {
  const masterDid = getDid(t)

  const opts = { masterDid, password }
  const promises = []

  for (const func of funcMap) {
    promises.push(new Promise(async (resolve) => {
      await t.throwsAsync(func(opts), Error)
      resolve()
    }))
  }
  await Promise.all(promises)
})

test.serial('compileAndUpgradeRegistry(opts)', async (t) => {
  const masterDid = getDid(t)

  await replaceVersions(versionName2)

  delete require.cache[require.resolve('../constants')]
  constants = require('../constants')

  const opts = { masterDid, password }

  await t.notThrowsAsync(factory.compileAndUpgradeRegistry(opts))
  const latestRegistryAddress = await factory.getLatestVersionAddress(constants.REGISTRY_NAME)
  const oldRegistryAddress = await factory.getUpgradeableContractAddress(constants.REGISTRY_NAME, versionName1)
  const registryAddress = await factory.getUpgradeableContractAddress(constants.REGISTRY_NAME, constants.REGISTRY_VERSION)
  t.is(latestRegistryAddress, registryAddress)
  t.not(oldRegistryAddress, latestRegistryAddress)

  await resetVersions(versionName2)
})

test.serial('compileAndUpgradeLibrary(opts)', async (t) => {
  const masterDid = getDid(t)

  await replaceVersions(versionName2)

  delete require.cache[require.resolve('../constants')]
  constants = require('../constants')

  const opts = { masterDid, password }

  await t.notThrowsAsync(factory.compileAndUpgradeLibrary(opts))
  const latestLibraryAddress = await factory.getLatestVersionAddress(constants.LIBRARY_NAME)
  const oldLibraryAddress = await factory.getUpgradeableContractAddress(constants.LIBRARY_NAME, versionName1)
  const libraryAddress = await factory.getUpgradeableContractAddress(constants.LIBRARY_NAME, constants.LIBRARY_VERSION)
  t.is(latestLibraryAddress, libraryAddress)
  t.not(oldLibraryAddress, latestLibraryAddress)

  await resetVersions(versionName2)
})

test.serial('compileAndUpgradeToken(opts)', async (t) => {
  const masterDid = getDid(t)

  await replaceVersions(versionName2)

  delete require.cache[require.resolve('../constants')]
  constants = require('../constants')

  const opts = { masterDid, password }

  await t.notThrowsAsync(factory.compileAndUpgradeToken(opts))
  const latestTokenAddress = await factory.getLatestVersionAddress(constants.TOKEN_NAME)
  const oldTokenAddress = await factory.getUpgradeableContractAddress(constants.TOKEN_NAME, versionName1)
  const tokenAddress = await factory.getUpgradeableContractAddress(constants.TOKEN_NAME, constants.TOKEN_VERSION)
  t.is(latestTokenAddress, tokenAddress)
  t.not(oldTokenAddress, latestTokenAddress)

  await resetVersions(versionName2)
})
