const { getAddressFromDID } = require('ara-util')
const ownership = require('../ownership')
const test = require('ava')

const {
  TEST_OWNER_DID,
  TEST_OWNER_ADDRESS,
  TEST_AFS_DID1,
  TEST_AFS_DID3,
  PASSWORD: password,
  TEST_FARMER_DID1,
  TEST_FARMER_DID2,
  RANDOM_DID
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
  await sendEthAraAndDeposit(TEST_FARMER_DID2)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount1)
  await cleanup(t.context.afsAccount2)
  await cleanup(t.context.ownerAccount2)
  await cleanup(t.context.ownerAccount3)
})

test.serial('getOwner(contentDid) no proxy', async (t) => {
  const contentDid = getAfsDid2(t)

  await t.throwsAsync(ownership.getOwner(contentDid), {instanceOf: Error})
})

test.serial('hasRequested(opts) no proxy', async (t) => {
  const contentDid = getAfsDid2(t)
  const requesterDid = getOwnerDid2(t)

  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid }))
})

test.serial('approveOwnershipTransfer(opts) no proxy', async (t) => {
  const contentDid = getAfsDid2(t)
  const newOwnerDid = getOwnerDid2(t)

  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password }), {instanceOf: Error})
})

test.serial('requestOwnership and revokeOwnershipRequest no proxy', async (t) => {
  const contentDid = getAfsDid2(t)
  const requesterDid = getOwnerDid2(t)

  const promises = []
  for (const func of funcMap) {
    promises.push(new Promise(async (resolve) => {
      await t.throwsAsync(func({ contentDid, requesterDid, password }))
      resolve()
    }))
  }
  await Promise.all(promises)
})

test.serial('getOwner(contentDid)', async (t) => {
  const contentDid = getAfsDid1(t)

  const initialOwner = await ownership.getOwner(contentDid)
  t.is(initialOwner.toLowerCase(), TEST_OWNER_ADDRESS)
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

test.serial('requestOwnership(opts) already requested', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getOwnerDid2(t)

  await t.throwsAsync(ownership.requestOwnership({ requesterDid, contentDid, password }), {instanceOf: Error})
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

test.serial('revokeOwnershipRequest(opts)', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getOwnerDid3(t)

  await ownership.requestOwnership({ requesterDid, contentDid, password })

  let requested = await ownership.hasRequested({ requesterDid, contentDid })
  t.true(requested)

  const receipt = await ownership.revokeOwnershipRequest({ requesterDid, contentDid, password })
  t.true(receipt && 'object' === typeof receipt)

  requested = await ownership.hasRequested({ requesterDid, contentDid })
  t.false(requested)
})

test.serial('revokeOwnershipRequest(opts) already revoked', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getOwnerDid3(t)

  await t.throwsAsync(ownership.revokeOwnershipRequest({ requesterDid, contentDid, password }), {instanceOf: Error})
})

test.serial('approveOwnershipTransfer(opts)', async (t) => {
  const contentDid = getAfsDid1(t)
  const newOwnerDid = getOwnerDid2(t)

  const cost = await ownership.approveOwnershipTransfer({
    contentDid,
    newOwnerDid,
    password,
    estimate: true
  })
  t.true(cost > 0)

  const receipt = await ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password })
  t.true(receipt && 'object' === typeof receipt)

  const owner = await ownership.getOwner(contentDid)
  t.is(owner.toLowerCase(), await getAddressFromDID(newOwnerDid))
})

test.serial('hasRequested(opts) invalid opts', async (t) => {
  const requesterDid = getOwnerDid2(t)

  await t.throwsAsync(ownership.hasRequested(), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested(''), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested('opts'), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested(123), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested([ ]), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested(true), {instanceOf: TypeError})

  await t.throwsAsync(ownership.hasRequested({ requesterDid }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(ownership.hasRequested({ requesterDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid: true }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid: { } }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid: true }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.hasRequested({ requesterDid, contentDid: { } }), {instanceOf: TypeError})
})

test.serial('getOwner(contentDid) invalid opts', async (t) => {
  await t.throwsAsync(ownership.getOwner(), {instanceOf: TypeError})
  await t.throwsAsync(ownership.getOwner(''), {instanceOf: TypeError})
  await t.throwsAsync(ownership.getOwner({ }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.getOwner('did:ara:invalid'), {instanceOf: Error})
  await t.throwsAsync(ownership.getOwner(123), {instanceOf: TypeError})
  await t.throwsAsync(ownership.getOwner(true), {instanceOf: TypeError})
})

test.serial('approveOwnershipTransfer(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid1(t)
  const newOwnerDid = getOwnerDid2(t)

  await t.throwsAsync(ownership.approveOwnershipTransfer(), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer(''), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer('opts'), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer(123), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer([ ]), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer(true), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid: true }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid: { } }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid: true }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid: { } }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password: '' }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password: 'wrong' }), {instanceOf: Error})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password: true }), {instanceOf: TypeError})
  await t.throwsAsync(ownership.approveOwnershipTransfer({ contentDid, newOwnerDid, password: { } }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({
    contentDid,
    newOwnerDid,
    password,
    estimate: { }
  }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({
    contentDid,
    newOwnerDid,
    password,
    estimate: 'estimate'
  }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({
    contentDid,
    newOwnerDid,
    password,
    estimate: 123
  }), {instanceOf: TypeError})

  await t.throwsAsync(ownership.approveOwnershipTransfer({
    contentDid,
    newOwnerDid: RANDOM_DID,
    password,
    estimate: true
  }), Error)
})

test.serial('requestOwnership and revokeOwnershipRequest invalid generic opts', async (t) => {
  const contentDid = getAfsDid1(t)
  const undeployedDid = getAfsDid2(t)
  const requesterDid = getOwnerDid2(t)

  const promises = []
  for (const func of funcMap) {
    promises.push(new Promise(async (resolve) => {
      await t.throwsAsync(func(), {instanceOf: TypeError})
      await t.throwsAsync(func({ }), {instanceOf: TypeError})
      await t.throwsAsync(func(''), {instanceOf: TypeError})
      await t.throwsAsync(func('opts'), {instanceOf: TypeError})
      await t.throwsAsync(func(123), {instanceOf: TypeError})
      await t.throwsAsync(func([ ]), {instanceOf: TypeError})
      await t.throwsAsync(func(true), {instanceOf: TypeError})

      await t.throwsAsync(func({ contentDid }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid: '' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid: 'did:ara:invalid' }), {instanceOf: Error})
      await t.throwsAsync(func({ contentDid: 123 }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid: true }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid: { } }), {instanceOf: TypeError})

      await t.throwsAsync(func({ contentDid, requesterDid }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid: '' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid: 'did:ara:invalid' }), {instanceOf: Error})
      await t.throwsAsync(func({ contentDid, requesterDid: 123 }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid: true }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid: { } }), {instanceOf: TypeError})

      await t.throwsAsync(func({ contentDid, requesterDid, password: '' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid, password: 'wrong' }), {instanceOf: Error})
      await t.throwsAsync(func({ contentDid, requesterDid, password: 123 }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid, password: true }), {instanceOf: TypeError})
      await t.throwsAsync(func({ contentDid, requesterDid, password: { } }), {instanceOf: TypeError})

      await t.throwsAsync(func({
        contentDid,
        requesterDid,
        password,
        estimate: { }
      }), {instanceOf: TypeError})

      await t.throwsAsync(func({
        contentDid,
        requesterDid,
        password,
        estimate: 'estimate'
      }), {instanceOf: TypeError})

      await t.throwsAsync(func({
        contentDid,
        requesterDid,
        password,
        estimate: 123
      }), {instanceOf: TypeError})

      await t.throwsAsync(func({
        contentDid: undeployedDid,
        requesterDid,
        password
      }), Error)
      resolve()
    }))
  }
  await Promise.all(promises)
})
