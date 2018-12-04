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
