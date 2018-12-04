const { isAddress } = require('ara-util/web3')
const { registry } = require('../')
const { resolve } = require('path')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID,
  PASSWORD: password
} = require('./_constants')

const {
  mirrorIdentity,
  cleanup
} = require('./_util')

const getDid = (t) => {
  const { did } = t.context.defaultAccount
  return did
}

const getAfsDid = (t) => {
  const { did } = t.context.afsAccount
  return did
}

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID)
})

test.after(async (t) => {
  await cleanup(t)
})

test.serial('deployNewStandard()', async (t) => {
  const owner = getDid(t)
  const paths = [ resolve(__dirname, '../contracts/AFS.sol'), resolve(__dirname, '../contracts/Library.sol'), resolve(__dirname, '../contracts/Registry.sol'), resolve(__dirname, '../contracts/Proxy.sol'), resolve(__dirname, '../contracts/AraToken.sol') ]
  const version = '2'
  const address = await registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  })
  t.true(isAddress(address))
  const latest = await registry.getLatestStandard()
  t.is(address, latest)
  const standard = await registry.getStandard(version)
  t.is(address, standard)
})

test.serial('deployNewStandard() uncompilable standard', async (t) => {
  const owner = getDid(t)
  const paths = []
  const version = '3'
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  }), Error, 'Failed to compile standard.')
})

test.serial('deployNewStandard() standard version exists', async (t) => {
  const owner = getDid(t)
  const paths = [ 'node_modules/ara-contracts/contracts/AFS.sol', 'node_modules/ara-contracts/contracts/Library.sol', 'node_modules/ara-contracts/contracts/Registry.sol', 'node_modules/ara-contracts/contracts/Proxy.sol', 'node_modules/ara-contracts/contracts/AraToken.sol' ]
  const version = '2'
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  }))
})

test.serial('proxyExists() does not exist', async (t) => {
  let exists = await registry.proxyExists('')
  t.false(exists)
  exists = await registry.proxyExists(TEST_OWNER_DID_NO_METHOD)
  t.false(exists)
})

test.serial('deployProxy()', async (t) => {
  const did = getAfsDid(t)

  const deployedAddress = await registry.deployProxy({
    contentDid: did,
    password,
    version: '2'
  })
  const exists = await registry.proxyExists(did)
  t.true(exists)
  const gotAddress = await registry.getProxyAddress(did)
  t.is(gotAddress, deployedAddress)
})

test.serial('upgradeProxy()', async (t) => {
  const did = getAfsDid(t)

  const upgraded = await registry.upgradeProxy({
    contentDid: did,
    password,
    version: '2'
  })
  t.true(upgraded)
  const version = await registry.getProxyVersion(did)
  t.is(version, '2')
})

test.serial('deployNewStandard() invalid opts', async (t) => {
  const owner = getDid(t)

  await t.throwsAsync(registry.deployNewStandard(), TypeError)
  await t.throwsAsync(registry.deployNewStandard('opts'), TypeError)
  await t.throwsAsync(registry.deployNewStandard({ }), TypeError)

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: '' }), Error)
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: 'did:ara:invalid' }), Error)

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: '' }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: 18 }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: 'notright' }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password }), TypeError)

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password, paths: [] }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password, paths: [ './path' ] }), TypeError)

  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    paths: [ './path' ],
    version: null
  }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    paths: [ './path' ],
    version: false
  }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: 'did:ara:invalid',
    password,
    paths: [ './path' ],
    version: '1'
  }), Error)
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password: '',
    paths: [ './path' ],
    version: '1'
  }), TypeError)
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password: '',
    paths: [ ],
    version: '1'
  }), TypeError)
})

test.serial('deployProxy() invalid opts', async (t) => {
  const did = getAfsDid(t)

  await t.throwsAsync(registry.deployProxy(), TypeError)
  await t.throwsAsync(registry.deployProxy('opts'), TypeError)
  await t.throwsAsync(registry.deployProxy({ }), TypeError)

  await t.throwsAsync(registry.deployProxy({ did: '' }), Error)
  await t.throwsAsync(registry.deployProxy({ did: 'did:ara:invalid' }), Error)

  await t.throwsAsync(registry.deployProxy({ did, password: '' }), TypeError)
  await t.throwsAsync(registry.deployProxy({ did, password: 18 }), TypeError)
  await t.throwsAsync(registry.deployProxy({ did, password: 'notright' }), Error)

  await t.throwsAsync(registry.deployProxy({ did, password, version: true }), Error)
  await t.throwsAsync(registry.deployProxy({ did, password, version: { } }), Error)
  await t.throwsAsync(registry.deployProxy({ did: 'did:ara:invalid', password, version: '1' }))
  await t.throwsAsync(registry.deployProxy({ did, password: 'invalid', version: '1' }))
})

test.serial('upgradeProxy() invalid opts', async (t) => {
  await t.throwsAsync(registry.upgradeProxy(), TypeError)
  await t.throwsAsync(registry.upgradeProxy('opts'), TypeError)
  await t.throwsAsync(registry.upgradeProxy({ }), TypeError)

  await t.throwsAsync(registry.upgradeProxy({ did: '' }), Error)
  await t.throwsAsync(registry.upgradeProxy({ did: 'did:ara:invalid' }), Error)

  const did = getAfsDid(t)

  await t.throwsAsync(registry.upgradeProxy({ did, password: '' }), TypeError)
  await t.throwsAsync(registry.upgradeProxy({ did, password: 18 }), TypeError)
  await t.throwsAsync(registry.upgradeProxy({ did, password: 'notright' }), Error)

  await t.throwsAsync(registry.upgradeProxy({ did, password, version: true }), Error)
  await t.throwsAsync(registry.upgradeProxy({ did, password, version: { } }), Error)
  await t.throwsAsync(registry.upgradeProxy({ did: 'did:ara:invalid', password, version: '1' }))
  await t.throwsAsync(registry.upgradeProxy({ did, password: 'invalid', version: '1' }))
  await t.throwsAsync(registry.upgradeProxy({ did, password, version: '10000' }))
})
