/* eslint-disable object-curly-newline */

const { abi } = require('../build/contracts/AFS.json')
const { rewards, purchase, registry } = require('../')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_AFS_DID3,
  PASSWORD: password,
  VALID_JOBID
} = require('./_constants')

const {
  web3: {
    contract
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

const getAfsDid = (t) => {
  const { did } = t.context.afsAccount
  return did
}

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID3)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
})

let proxyAddress
let jobId

test.serial('submit(opts) no proxy', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  await t.throwsAsync(rewards.submit({
    requesterDid,
    contentDid,
    password,
    job: {
      jobId: VALID_JOBID,
      budget: 100
    }
  }), Error)
})

test.serial('getBudget(opts) no proxy', async (t) => {
  const contentDid = getAfsDid(t)

  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: VALID_JOBID }), Error)
})

test.serial('submit(opts) has not purchased', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  proxyAddress = await registry.deployProxy({ contentDid, password, version: '1' })

  await t.throwsAsync(rewards.submit({
    requesterDid,
    contentDid,
    password,
    job: {
      jobId: VALID_JOBID,
      budget: 100
    }
  }), Error)
})

test.serial('submit(opts)', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  const { jobId: prefixedJobId } = await purchase({
    requesterDid,
    contentDid,
    password
  })

  jobId = prefixedJobId.slice(2)
  console.log('JOB ID IS', jobId)

  const { contract: proxy, ctx } = await contract.get(abi, proxyAddress)
  proxy.events.BudgetSubmitted({ fromBlock: 'latest' })
    .on('data', (log) => {
      const { returnValues: { _jobId } } = log
      if (_jobId === prefixedJobId) {
        t.pass()
      } else {
        t.fail()
      }
      ctx.close()
    })

  const receipt = await rewards.submit({
    requesterDid,
    contentDid,
    password,
    job: {
      jobId,
      budget: 100
    }
  })

  t.true('object' === typeof receipt)
})

test.serial('submit(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  await t.throwsAsync(rewards.submit(), TypeError)
  await t.throwsAsync(rewards.submit({ }), TypeError)
  await t.throwsAsync(rewards.submit(''), TypeError)
  await t.throwsAsync(rewards.submit('opts'), TypeError)
  await t.throwsAsync(rewards.submit(true), TypeError)
  await t.throwsAsync(rewards.submit(123), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid: '' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.submit({ requesterDid: { } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid: 123 }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid: true }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid: '' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid: 'did:ara:invalid' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid: { } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid: true }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: '' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: 'wrong' }), Error)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: 123 }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: { } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: true }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: null }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: '' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: 'string' }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: 123 }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: true }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { } }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: null } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: '' } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: 'invalid' } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: 123 } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: true } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: { } } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: '0x0' } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: `${VALID_JOBID}morechars` } }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, budget: 0 } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, budget: '0' } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, budget: 'notanumber' } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, budget: true } }), TypeError)
  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, budget: { } } }), TypeError)

  await t.throwsAsync(rewards.submit({ requesterDid, contentDid, password: 'wrong', job: { jobId: VALID_JOBID, budget: 10 } }), Error)
})

test.serial('getBudget(opts)', async (t) => {
  const contentDid = getAfsDid(t)

  const budget = await rewards.getBudget({ contentDid, jobId })
  t.is(budget, '100')
})

test.serial('getBudget(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid(t)

  await t.throwsAsync(rewards.getBudget(), TypeError)
  await t.throwsAsync(rewards.getBudget({ }), TypeError)
  await t.throwsAsync(rewards.getBudget(''), TypeError)
  await t.throwsAsync(rewards.getBudget('opts'), TypeError)
  await t.throwsAsync(rewards.getBudget(true), TypeError)
  await t.throwsAsync(rewards.getBudget(123), TypeError)

  await t.throwsAsync(rewards.getBudget({ contentDid }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid: '' }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.getBudget({ contentDid: { } }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid: 123 }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid: true }), TypeError)

  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: null }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: '' }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: 'invalid' }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: 123 }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: true }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: { } }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: '0x0' }), TypeError)
  await t.throwsAsync(rewards.getBudget({ contentDid, jobId: `${VALID_JOBID}morechars` }), TypeError)
})
