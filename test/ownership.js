const { ownership, registry } = require('../')
const test = require('ava')

const {
  TEST_OWNER_DID,
  TEST_OWNER_ADDRESS,
  TEST_AFS_DID1,
  PASSWORD: password,
  TEST_FARMER_DID1
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

const getAfsDid = (t) => {
  const { did } = t.context.afsAccount
  return did
}

test.before(async (t) => {
  t.context.ownerAccount1 = await mirrorIdentity(TEST_OWNER_DID)
  t.context.ownerAccount2 = await mirrorIdentity(TEST_FARMER_DID1)
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID1)

  await sendEthAraAndDeposit(TEST_FARMER_DID1)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
  await cleanup(t.context.ownerAccount2)
})

test.serial('getOwner(contentDid)', async (t) => {
  const contentDid = getAfsDid(t)

  await registry.deployProxy({
    contentDid,
    password,
    version: '1'
  })

  const initialOwner = await ownership.getOwner(contentDid)
  t.is(initialOwner, TEST_OWNER_ADDRESS)
})

test.serial('hasRequested(opts) false', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getOwnerDid2(t)

  const hasRequested = await ownership.hasRequested({ requesterDid, contentDid })

  t.false(hasRequested)
})

test.serial('requestOwnership(opts)', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getOwnerDid2(t)

  const receipt = await ownership.requestOwnership({ requesterDid, contentDid, password })
  t.true(receipt && 'object' === typeof receipt)
})

test.serial('hasRequested(opts) true', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getOwnerDid2(t)

  const hasRequested = await ownership.hasRequested({ requesterDid, contentDid })

  t.true(hasRequested)
})
