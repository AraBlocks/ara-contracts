/* eslint-disable no-await-in-loop */

const ownership = require('../ownership')
const test = require('ava')

const {
  TEST_OWNER_DID,
  TEST_OWNER_ADDRESS,
  TEST_AFS_DID1,
  TEST_AFS_DID3,
  PASSWORD: password,
  TEST_FARMER_DID1,
  TEST_FARMER_DID2
} = require('./_constants')

const {
  sendEthAraAndDeposit,
  mirrorIdentity,
  cleanup
} = require('./_util')

const getOwnerDid2 = (t) => {
  const { did } = t.context.ownerAccount2
  return did
}

const getOwnerDid3 = (t) => {
  const { did } = t.context.ownerAccount3
  return did
}

const getAfsDid1 = (t) => {
  const { did } = t.context.afsAccount1
  return did
}

const getAfsDid2 = (t) => {
  const { did } = t.context.afsAccount2
  return did
}

const funcMap = [
  ownership.requestOwnership,
  ownership.revokeOwnershipRequest
]

test.before(async (t) => {
  t.context.ownerAccount1 = await mirrorIdentity(TEST_OWNER_DID)
  t.context.ownerAccount2 = await mirrorIdentity(TEST_FARMER_DID1)
  t.context.ownerAccount3 = await mirrorIdentity(TEST_FARMER_DID2)
  t.context.afsAccount1 = await mirrorIdentity(TEST_AFS_DID1)
  t.context.afsAccount2 = await mirrorIdentity(TEST_AFS_DID3)

  await sendEthAraAndDeposit(TEST_FARMER_DID1)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount1)
  await cleanup(t.context.afsAccount2)
  await cleanup(t.context.ownerAccount2)
  await cleanup(t.context.ownerAccount3)
})

test('getOwner(contentDid) no proxy', async (t) => {
  const contentDid = getAfsDid2(t)

  await t.throwsAsync(ownership.getOwner(contentDid), Error)
})

test.serial('getOwner(contentDid)', async (t) => {
  const contentDid = getAfsDid1(t)

  const initialOwner = await ownership.getOwner(contentDid)
  t.is(initialOwner, TEST_OWNER_ADDRESS)
})

test.serial('hasRequested(opts) false', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getOwnerDid2(t)

  const hasRequested = await ownership.hasRequested({ requesterDid, contentDid })

  t.false(hasRequested)
})

test.serial('requestOwnership(opts)', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getOwnerDid2(t)

  const cost = await ownership.requestOwnership({
    requesterDid,
    contentDid,
    password,
    estimate: true
  })

  t.true(cost > 0)

  const receipt = await ownership.requestOwnership({ requesterDid, contentDid, password })
  t.true(receipt && 'object' === typeof receipt)
})

test.serial('hasRequested(opts) true', async (t) => {
  const contentDid = getAfsDid1(t)

  let requesterDid = getOwnerDid2(t)
  let hasRequested = await ownership.hasRequested({ requesterDid, contentDid })
  t.true(hasRequested)

  requesterDid = getOwnerDid3(t)
  hasRequested = await ownership.hasRequested({ requesterDid, contentDid })
  t.false(hasRequested)
})

test.serial('getOwner(contentDid) invalid opts', async (t) => {
  await t.throwsAsync(ownership.getOwner(), TypeError)
  await t.throwsAsync(ownership.getOwner(''), TypeError)
  await t.throwsAsync(ownership.getOwner({ }), TypeError)
  await t.throwsAsync(ownership.getOwner('did:ara:invalid'), Error)
  await t.throwsAsync(ownership.getOwner(123), TypeError)
  await t.throwsAsync(ownership.getOwner(true), TypeError)
})

test.serial('requestOwnership and revokeOwnershipRequest invalid generic opts', async (t) => {
  const contentDid = getAfsDid1(t)
  const undeployedDid = getAfsDid2(t)
  const requesterDid = getOwnerDid2(t)

  for (const func of funcMap) {
    await t.throwsAsync(func(), TypeError)
    await t.throwsAsync(func({ }), TypeError)
    await t.throwsAsync(func(''), TypeError)
    await t.throwsAsync(func('opts'), TypeError)
    await t.throwsAsync(func(123), TypeError)
    await t.throwsAsync(func([ ]), TypeError)
    await t.throwsAsync(func(true), TypeError)

    await t.throwsAsync(func({ contentDid }), TypeError)
    await t.throwsAsync(func({ contentDid: '' }), TypeError)
    await t.throwsAsync(func({ contentDid: 'did:ara:invalid' }), Error)
    await t.throwsAsync(func({ contentDid: 123 }), TypeError)
    await t.throwsAsync(func({ contentDid: true }), TypeError)
    await t.throwsAsync(func({ contentDid: { } }), TypeError)

    await t.throwsAsync(func({ contentDid, requesterDid }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid: '' }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid: 'did:ara:invalid' }), Error)
    await t.throwsAsync(func({ contentDid, requesterDid: 123 }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid: true }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid: { } }), TypeError)

    await t.throwsAsync(func({ contentDid, requesterDid, password: '' }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid, password: 'wrong' }), Error)
    await t.throwsAsync(func({ contentDid, requesterDid, password: 123 }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid, password: true }), TypeError)
    await t.throwsAsync(func({ contentDid, requesterDid, password: { } }), TypeError)

    await t.throwsAsync(func({
      contentDid,
      requesterDid,
      password,
      estimate: { }
    }), TypeError)

    await t.throwsAsync(func({
      contentDid,
      requesterDid,
      password,
      estimate: 'estimate'
    }), TypeError)

    await t.throwsAsync(func({
      contentDid,
      requesterDid,
      password,
      estimate: 123
    }), TypeError)

    await t.throwsAsync(func({
      contentDid: undeployedDid,
      requesterDid,
      password
    }), Error)
  }
})
