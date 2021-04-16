const test = require('ava')
const {
  hashDID,
  web3: {
    contract
  },
  transform: {
    toHexString
  }
} = require('ara-util')
const { abi } = require('../build/contracts/AFS.json')
const { purchase, registry } = require('..')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID1,
  TEST_AFS_DID2,
  TEST_DID,
  PASSWORD: password,
  ZERO_BYTES32
} = require('./_constants')

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

  await t.throwsAsync(purchase({ requesterDid, contentDid, password }), Error)
})

test.serial('purchase(opts) no proxy', async (t) => {
  const requesterDid = getDid(t)

  await t.throwsAsync(purchase({ requesterDid, contentDid: TEST_DID, password }), Error)
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

  await t.throwsAsync(purchase(), TypeError)
  await t.throwsAsync(purchase({ }), TypeError)
  await t.throwsAsync(purchase('opts'), TypeError)
  await t.throwsAsync(purchase(true), TypeError)
  await t.throwsAsync(purchase(123), TypeError)

  await t.throwsAsync(purchase({ requesterDid }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: '' }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(purchase({ requesterDid: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid: true }), TypeError)

  await t.throwsAsync(purchase({ requesterDid, contentDid }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: '' }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid: true }), TypeError)

  await t.throwsAsync(purchase({ requesterDid, contentDid, password: '' }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 'wrong' }), Error)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: 123 }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: { } }), TypeError)
  await t.throwsAsync(purchase({ requesterDid, contentDid, password: true }), TypeError)

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: '0'
  }), TypeError)

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: { }
  }), TypeError)

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: true
  }), TypeError)

  await t.throwsAsync(purchase({
    requesterDid,
    contentDid,
    password,
    budget: -1
  }), TypeError)
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
