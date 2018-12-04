const { purchase, registry } = require('../')
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

test.serial('purchase(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  const deployedAddress = await registry.deployProxy({
    contentDid,
    password,
    version: '1'
  })

  await t.throwsAsync(purchase(), TypeError)
  await t.throwsAsync(purchase({ }), TypeError)
  await t.throwsAsync(purchase('opts'), TypeError)
  await t.throwsAsync(purchase(true), TypeError)
  await t.throwsAsync(purchase(123), TypeError)

  await t.throwsAsync(purchase({ requesterDid: '' }), Error)
  await t.throwsAsync(purchase({ requesterDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(purchase({ requesterDid: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: true }), TypeError)

  await t.throwsAsync(purchase({ requesterDid, contentDid: '' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: true }), TypeError)

  await t.throwsAsync(purchase({ requesterDid, contentDid, password: '' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 'wrong' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: true }), TypeError)

  await t.throwsAsync(purchase({ requesterDid, contentDid, password, budget: '0'}), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password, budget: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password, budget: true }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password, budget: -1 }), TypeError)
})
