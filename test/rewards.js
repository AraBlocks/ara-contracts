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

test.serial('submit(opts)', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  const proxyAddress = await registry.deployProxy({ contentDid, password, version: '1' })

  const { jobId } = await purchase({
    requesterDid,
    contentDid,
    password
  })

  const { contract: proxy, ctx } = await contract.get(abi, proxyAddress)
  proxy.events.BudgetSubmitted({ fromBlock: 'latest' })
    .on('data', (log) => {
      const { returnValues: { _jobId } } = log
      if (_jobId === jobId) {
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
})
