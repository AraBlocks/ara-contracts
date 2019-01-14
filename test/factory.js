const constants = require('../constants')
const { factory } = require('../')
const pify = require('pify')
const path = require('path')
const test = require('ava')
const fs = require('fs')

const {
  TEST_OWNER_DID_NO_METHOD,
  BYTESDIR
} = require('./_constants')

const {
  cleanupAndResetBytesPath,
  replaceBytesPath,
  mirrorIdentity,
} = require('./_util')

// const getDid = (t) => {
//   const { did } = t.context.defaultAccount
//   return did
// }

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  await replaceBytesPath()
})

test.after(async () => {
  await cleanupAndResetBytesPath()
})

test.serial('compileAraContracts()', async (t) => {
  await factory.compileAraContracts()
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Registry_${constants.REGISTRY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Library_${constants.LIBRARY_VERSION}`)))
  await t.notThrowsAsync(pify(fs.readFile)(path.resolve(BYTESDIR, `./Token_${constants.TOKEN_VERSION}`)))
})
