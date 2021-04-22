const { isAddress } = require('ara-util/web3')
const { resolve } = require('path')
const rimraf = require('rimraf')
const pify = require('pify')
const test = require('ava')
const { registry } = require('..')
const { BYTESDIR } = require('../constants')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID1,
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
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID1)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
  await pify(rimraf)(`${BYTESDIR}/Standard_2.1`)
  await pify(rimraf)(`${BYTESDIR}/Standard_3.1`)
})

test.serial('deployNewStandard(opts)', async (t) => {
  const owner = getDid(t)
  const paths = [ resolve(__dirname, '../contracts/ignored_contracts/AFS.sol'), resolve(__dirname, '../contracts/ignored_contracts/Library.sol'), resolve(__dirname, '../contracts/ignored_contracts/Registry.sol'), resolve(__dirname, '../contracts/AraProxy.sol'), resolve(__dirname, '../contracts/ignored_contracts/AraToken.sol') ]
  const version = '2.1'
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

test.serial('deployNewStandard(opts) uncompilable standard', async (t) => {
  const owner = getDid(t)
  const paths = []
  const version = '3.1'
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  }), { instanceOf: Error }, 'Failed to compile standard.')
})

test.serial('deployNewStandard(opts) standard version exists', async (t) => {
  const owner = getDid(t)
  const paths = [ resolve(__dirname, '../contracts/ignored_contracts/AFS.sol'), resolve(__dirname, '../contracts/ignored_contracts/Library.sol'), resolve(__dirname, '../contracts/ignored_contracts/Registry.sol'), resolve(__dirname, '../contracts/AraProxy.sol'), resolve(__dirname, '../contracts/ignored_contracts/AraToken.sol') ]
  const version = '2.1'
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  }), { instanceOf: Error })
})

test.serial('deployNewStandard(opts) not owner', async (t) => {
  const owner = getAfsDid(t)
  const paths = [ resolve(__dirname, '../contracts/ignored_contracts/AFS.sol'), resolve(__dirname, '../contracts/ignored_contracts/Library.sol'), resolve(__dirname, '../contracts/ignored_contracts/Registry.sol'), resolve(__dirname, '../contracts/AraProxy.sol'), resolve(__dirname, '../contracts/ignored_contracts/AraToken.sol') ]
  const version = '3.1'
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    version,
    paths
  }), { instanceOf: Error })
})

test.serial('deployNewStandard(opts) version is number', async (t) => {
  const owner = getDid(t)
  const paths = [ resolve(__dirname, '../contracts/ignored_contracts/AFS.sol'), resolve(__dirname, '../contracts/ignored_contracts/Library.sol'), resolve(__dirname, '../contracts/ignored_contracts/Registry.sol'), resolve(__dirname, '../contracts/AraProxy.sol'), resolve(__dirname, '../contracts/ignored_contracts/AraToken.sol') ]
  const version = 3.1
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

test.serial('getStandard(version) invalid opts', async (t) => {
  await t.throwsAsync(registry.getStandard(), { instanceOf: TypeError })
  await t.throwsAsync(registry.getStandard(''), { instanceOf: TypeError })
  await t.throwsAsync(registry.getStandard(true), { instanceOf: TypeError })
  await t.throwsAsync(registry.getStandard({ }), { instanceOf: TypeError })
})

test.serial('proxyExists() does not exist', async (t) => {
  let exists = await registry.proxyExists('')
  t.false(exists)
  exists = await registry.proxyExists(TEST_OWNER_DID_NO_METHOD)
  t.false(exists)
})

test.serial('deployProxy()', async (t) => {
  const did = getAfsDid(t)

  const cost1 = await registry.deployProxy({
    contentDid: did,
    password,
    version: 2.1,
    estimate: true
  })
  t.true(cost1 > 0)

  const fakeDid = 'did:ara:37ecb2a896412dfa6538ab4282d7d6a78492f1a0948963189c84fdb6dc263a13'
  const cost2 = await registry.deployProxy({
    contentDid: fakeDid,
    password,
    ownerDid: getDid(t),
    version: 2.1
  })
  t.true(cost1 === cost2)

  const deployedAddress = await registry.deployProxy({
    contentDid: did,
    password,
    version: 2.1
  })
  const exists = await registry.proxyExists(did)
  t.true(exists)
  const gotAddress = await registry.getProxyAddress(did)
  t.is(gotAddress, deployedAddress)
})

test.serial('deployProxy() already exists', async (t) => {
  const did = getAfsDid(t)

  await t.throwsAsync(registry.deployProxy({
    contentDid: did,
    password,
    version: 2.1
  }), { instanceOf: Error })
})

test.serial('upgradeProxy()', async (t) => {
  const did = getAfsDid(t)

  const cost = await registry.upgradeProxy({
    contentDid: did,
    password,
    version: 3.1,
    estimate: true
  })
  t.true(cost > 0)

  const upgraded = await registry.upgradeProxy({
    contentDid: did,
    password,
    version: 3.1
  })
  t.true(upgraded)
  const version = await registry.getProxyVersion(did)
  t.is(version, '3.1')
})

test.serial('getProxyVersion(contentDid) invalid opts', async (t) => {
  await t.throwsAsync(registry.getProxyVersion(), { instanceOf: TypeError })
  await t.throwsAsync(registry.getProxyVersion({ }), { instanceOf: TypeError })
  await t.throwsAsync(registry.getProxyVersion(''), { instanceOf: TypeError })
  await t.throwsAsync(registry.getProxyVersion(123), { instanceOf: TypeError })
})

test.serial('deployNewStandard() invalid opts', async (t) => {
  const owner = getDid(t)

  await t.throwsAsync(registry.deployNewStandard(), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard('opts'), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({ }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: '' }), { instanceOf: Error })
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: 'did:ara:invalid' }), { instanceOf: Error })

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: '' }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: 18 }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password: 'notright' }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password, paths: [] }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({ requesterDid: owner, password, paths: [ './path' ] }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    paths: [ './path' ],
    version: null
  }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password,
    paths: [ './path' ],
    version: false
  }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: 'did:ara:invalid',
    password,
    paths: [ './path' ],
    version: '1'
  }), { instanceOf: Error })
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password: '',
    paths: [ './path' ],
    version: '1'
  }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployNewStandard({
    requesterDid: owner,
    password: '',
    paths: [ ],
    version: '1'
  }), { instanceOf: TypeError })
})

test.serial('deployProxy() invalid opts', async (t) => {
  const contentDid = getAfsDid(t)

  await t.throwsAsync(registry.deployProxy(), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployProxy('opts'), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployProxy({ }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployProxy({ contentDid: '' }), { instanceOf: Error })
  await t.throwsAsync(registry.deployProxy({ contentDid: 'did:ara:invalid' }), { instanceOf: Error })

  await t.throwsAsync(registry.deployProxy({ contentDid, password }), { instanceOf: Error })
  await t.throwsAsync(registry.deployProxy({ contentDid, password: '' }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployProxy({ contentDid, password: 18 }), { instanceOf: TypeError })
  await t.throwsAsync(registry.deployProxy({ contentDid, password: 'notright' }), { instanceOf: Error })

  await t.throwsAsync(registry.deployProxy({ contentDid, password, version: true }), { instanceOf: Error })
  await t.throwsAsync(registry.deployProxy({ contentDid, password, version: { } }), { instanceOf: Error })
  await t.throwsAsync(registry.deployProxy({ contentDid: 'did:ara:invalid', password, version: '1' }), { instanceOf: Error })
  await t.throwsAsync(registry.deployProxy({ contentDid, password: 'invalid', version: '1' }), { instanceOf: Error })

  await t.throwsAsync(registry.deployProxy({
    contentDid,
    password,
    version: '1',
    estimate: 1
  }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployProxy({
    contentDid,
    password,
    version: '1',
    estimate: 'invalid'
  }), { instanceOf: TypeError })

  await t.throwsAsync(registry.deployProxy({
    contentDid,
    password,
    version: '1',
    estimate: { }
  }), { instanceOf: TypeError })
})

test.serial('upgradeProxy() invalid opts', async (t) => {
  await t.throwsAsync(registry.upgradeProxy(), { instanceOf: TypeError })
  await t.throwsAsync(registry.upgradeProxy('opts'), { instanceOf: TypeError })
  await t.throwsAsync(registry.upgradeProxy({ }), { instanceOf: TypeError })

  await t.throwsAsync(registry.upgradeProxy({ contentDid: '' }), { instanceOf: Error })
  await t.throwsAsync(registry.upgradeProxy({ contentDid: 'did:ara:invalid' }), { instanceOf: Error })

  const contentDid = getAfsDid(t)

  await t.throwsAsync(registry.upgradeProxy({ contentDid, password: '' }), { instanceOf: TypeError })
  await t.throwsAsync(registry.upgradeProxy({ contentDid, password: 18 }), { instanceOf: TypeError })
  await t.throwsAsync(registry.upgradeProxy({ contentDid, password: 'notright' }), { instanceOf: Error })

  await t.throwsAsync(registry.upgradeProxy({ contentDid, password, version: true }), { instanceOf: Error })
  await t.throwsAsync(registry.upgradeProxy({ contentDid, password, version: { } }), { instanceOf: Error })
  await t.throwsAsync(registry.upgradeProxy({ contentDid: 'did:ara:invalid', password, version: '1' }), { instanceOf: Error })
  await t.throwsAsync(registry.upgradeProxy({ contentDid, password: 'invalid', version: '1' }), { instanceOf: Error })
  await t.throwsAsync(registry.upgradeProxy({ contentDid, password, version: '10000' }), { instanceOf: Error })

  await t.throwsAsync(registry.upgradeProxy({
    contentDid,
    password,
    version: '2',
    estimate: 1
  }), { instanceOf: TypeError })

  await t.throwsAsync(registry.upgradeProxy({
    contentDid,
    password,
    version: '2',
    estimate: 'invalid'
  }), { instanceOf: TypeError })

  await t.throwsAsync(registry.upgradeProxy({
    contentDid,
    password,
    version: '2',
    estimate: { }
  }), { instanceOf: TypeError })
})
