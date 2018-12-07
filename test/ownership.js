const ownership = require('../ownership')
const test = require('ava')

const {
  TEST_OWNER_DID,
  TEST_AFS_DID1,
  PASSWORD: password,
  TEST_FARMER_DID1
} = require('./_constants')

const getDid = (t) => {
  const { did } = t.context.defaultAccount
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
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
  await cleanup(t.context.ownerAccount2)
})

test.serial('requestOwnership(opts)', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  const owner = await ownership.getOwner(contentDid)
  console.log(owner)
})
