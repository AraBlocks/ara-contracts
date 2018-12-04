const { toHexString } = require('ara-util/transform')
const { library } = require('../')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID1,
  TEST_AFS_DID2,
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
})

test.serial('hasPurchased(opts)', async (t) => {
  const purchaserDid = getDid(t)
  const contentDid = getAfsDid(t)

  t.true(await library.hasPurchased({ purchaserDid, contentDid })) // contentDid is purchased in purchase.js tests
})

test.serial('hasPurchased(opts) invalid opts', async (t) => {
  const purchaserDid = getDid(t)
  const contentDid = getAfsDid(t)

  await t.throwsAsync(library.hasPurchased(), TypeError)
  await t.throwsAsync(library.hasPurchased({ }), TypeError)
  await t.throwsAsync(library.hasPurchased([ ]), TypeError)

  await t.throwsAsync(library.hasPurchased({ purchaserDid }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid: '' }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(library.hasPurchased({ purchaserDid: 123 }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid: true }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid: { } }), TypeError)

  await t.throwsAsync(library.hasPurchased({ purchaserDid, contentDid: '' }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid, contentDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(library.hasPurchased({ purchaserDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid, contentDid: true }), TypeError)
  await t.throwsAsync(library.hasPurchased({ purchaserDid, contentDid: { } }), TypeError)
})

test.serial('getLibrarySize(requesterDid)', async (t) => {
  const requesterDid = getDid(t)
  const size = await library.getLibrarySize(requesterDid)
  t.is(size, '2') // Two AFSs are purchased in purchase.js tests
})

test.serial('getLibrarySize(requesterDid) invalid opts', async (t) => {
  await t.throwsAsync(library.getLibrarySize(), TypeError)
  await t.throwsAsync(library.getLibrarySize(''), TypeError)
  await t.throwsAsync(library.getLibrarySize(123), TypeError)
  await t.throwsAsync(library.getLibrarySize(true), TypeError)
  await t.throwsAsync(library.getLibrarySize({ }), TypeError)
})

test.serial('getLibraryItem(opts)', async (t) => {
  const requesterDid = getDid(t)

  t.is(await library.getLibraryItem({ requesterDid, index: 0 }), toHexString(TEST_AFS_DID1, { encoding: 'hex', ethify: true}))
  t.is(await library.getLibraryItem({ requesterDid, index: 1 }), toHexString(TEST_AFS_DID2, { encoding: 'hex', ethify: true}))
})

test.serial('getLibraryItem(opts) invalid opts', async (t) => {
  const requesterDid = getDid(t)
  
  await t.throwsAsync(library.getLibraryItem(), TypeError)
  await t.throwsAsync(library.getLibraryItem({ }), TypeError)
  await t.throwsAsync(library.getLibraryItem([ ]), TypeError)

  await t.throwsAsync(library.getLibraryItem({ requesterDid }), TypeError)
  await t.throwsAsync(library.getLibraryItem({ requesterDid: '' }), TypeError)
  await t.throwsAsync(library.getLibraryItem({ requesterDid: 123 }), TypeError)
  await t.throwsAsync(library.getLibraryItem({ requesterDid: true }), TypeError)
  await t.throwsAsync(library.getLibraryItem({ requesterDid: { } }), TypeError)

  await t.throwsAsync(library.getLibraryItem({ requesterDid, index: '' }))
  await t.throwsAsync(library.getLibraryItem({ requesterDid, index: -1 }))
  await t.throwsAsync(library.getLibraryItem({ requesterDid, index: true }))
  await t.throwsAsync(library.getLibraryItem({ requesterDid, index: { } }))
})
