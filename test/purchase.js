const { abi } = require('../build/contracts/AFS.json')
const { purchase, registry } = require('../')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID1,
  TEST_AFS_DID2,
  TEST_DID,
  PASSWORD: password,
  ZERO_BYTES32
} = require('./_constants')

const {
  hashDID,
  web3: {
    contract
  },
  transform: {
    toHexString
  }
} = require('ara-util')

const {
  mirrorIdentity,
  cleanup
} = require('./_util')

const getDid = (t) => {
  const { did } = t.context.defaultAccount
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

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  t.context.afsAccount1 = await mirrorIdentity(TEST_AFS_DID1)
  t.context.afsAccount2 = await mirrorIdentity(TEST_AFS_DID2)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount1)
  await cleanup(t.context.afsAccount2)
})

test.serial('purchase(opts) no budget', async (t) => {
  const contentDid = getAfsDid1(t)
  const { jobId, receipt } = await _purchaseWithBudget(contentDid, 0, t)

  t.not(jobId, ZERO_BYTES32)
  t.true(receipt && 'object' === typeof receipt)
})

test.serial('purchase(opts) already purchased', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getDid(t)

  await t.throwsAsync(purchase({ requesterDid, contentDid, password }), {instanceOf: Error})
})

test.serial('purchase(opts) no proxy', async (t) => {
  const requesterDid = getDid(t)

  await t.throwsAsync(purchase({ requesterDid, contentDid: TEST_DID, password }), {instanceOf: Error})
})

test.serial('purchase(opts) budget', async (t) => {
  const contentDid = getAfsDid2(t)
  const { jobId, receipt } = await _purchaseWithBudget(contentDid, 100, t)

  t.not(jobId, ZERO_BYTES32)
  t.true(receipt && 'object' === typeof receipt)
})

test('purchase(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid1(t)
  const requesterDid = getDid(t)

  await t.throwsAsync(purchase(), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ }), {instanceOf: TypeError})
  await t.throwsAsync(purchase('opts'), {instanceOf: TypeError})
  await t.throwsAsync(purchase(true), {instanceOf: TypeError})
  await t.throwsAsync(purchase(123), {instanceOf: TypeError})

  await t.throwsAsync(purchase({ requesterDid }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(purchase({ requesterDid: { } }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid: true }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({ requesterDid, contentDid }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid: '' }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid: 'did:ara:invalid' }), {instanceOf: Error})
  await t.throwsAsync(purchase({ requesterDid, contentDid: { } }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid: true }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({ requesterDid, contentDid, password: '' }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 'wrong' }), {instanceOf: Error})
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: { } }), {instanceOf: TypeError})
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: true }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: '0'
  }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: { }
  }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: true
  }), {instanceOf: TypeError})

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: -1
  }), {instanceOf: TypeError})
})

async function _purchaseWithBudget(contentDid, budget, t) {
  const requesterDid = getDid(t)
  const hashedRequesterDid = toHexString(hashDID(requesterDid), { encoding: 'hex', ethify: true })

  let proxyAddress
  try {
    proxyAddress = await registry.deployProxy({ contentDid, password, version: '2.1' })
  } catch (err) {
    proxyAddress = await registry.getProxyAddress(contentDid)
  }

  const { contract: proxy, ctx } = await contract.get(abi, proxyAddress)
  proxy.events.Purchased({ fromBlock: 'latest' })
    .on('data', (log) => {
      const { returnValues: { _purchaser } } = log
      if (_purchaser === hashedRequesterDid) {
        t.pass()
      } else {
        t.fail()
      }
      ctx.close()
    })

  return purchase({
    requesterDid,
    contentDid,
    password,
    budget
  })
}
