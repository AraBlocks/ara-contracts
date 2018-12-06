/* eslint-disable object-curly-newline */
/* eslint-disable no-await-in-loop */

const { rewards, purchase, registry, token } = require('../')
const { abi } = require('../build/contracts/AFS.json')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  TEST_FARMER_DID1,
  TEST_FARMER_DID2,
  TEST_FARMER_DID3,
  TEST_FARMER_ADDRESS1,
  TEST_FARMER_ADDRESS2,
  TEST_FARMER_ADDRESS3,
  TEST_AFS_DID3,
  PASSWORD: password,
  VALID_JOBID,
  TEST_OWNER_ADDRESS
} = require('./_constants')

const {
  web3: {
    contract
  }
} = require('ara-util')

const {
  sendEthAraAndDeposit,
  mirrorIdentity,
  cleanup
} = require('./_util')

const funcMap = [
  rewards.getBudget,
  rewards.getJobOwner
]

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
  t.context.farmerAccount1 = await mirrorIdentity(TEST_FARMER_DID1)
  t.context.farmerAccount2 = await mirrorIdentity(TEST_FARMER_DID2)
  t.context.farmerAccount3 = await mirrorIdentity(TEST_FARMER_DID3)

  await sendEthAraAndDeposit(TEST_FARMER_DID1)
  await sendEthAraAndDeposit(TEST_FARMER_DID2)
  await sendEthAraAndDeposit(TEST_FARMER_DID3)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
  await cleanup(t.context.farmerAccount1)
  await cleanup(t.context.farmerAccount2)
  await cleanup(t.context.farmerAccount3)
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

test.serial('getBudget(opts) and getJobOwner(opts) no proxy', async (t) => {
  const contentDid = getAfsDid(t)

  for (const func of funcMap) {
    await t.throwsAsync(func({ contentDid, jobId: VALID_JOBID }), Error)
  }
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

test.serial('getBudget(opts)', async (t) => {
  const contentDid = getAfsDid(t)

  const budget = await rewards.getBudget({ contentDid, jobId })
  t.is(budget, '100')
})

test.serial('getJobOwner(opts)', async (t) => {
  const contentDid = getAfsDid(t)
  const jobOwner = await rewards.getJobOwner({ contentDid, jobId })
  t.is(jobOwner, TEST_OWNER_ADDRESS)
})

test.serial('allocate(opts) farmers with deposits', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)
  const farmers = [ TEST_FARMER_DID1, TEST_FARMER_DID2, TEST_FARMER_DID3 ]
  const farmerAddresses = [ TEST_FARMER_ADDRESS1, TEST_FARMER_ADDRESS2, TEST_FARMER_ADDRESS3 ]
  const allocation = [ '20', '30', '50' ]

  let count = 0
  let allocated = 0
  const { contract: proxy, ctx } = await contract.get(abi, proxyAddress)
  await new Promise((resolve, reject) => {
    rewards.allocate({
      requesterDid,
      contentDid,
      password,
      job: {
        jobId,
        farmers,
        rewards: allocation
      }
    })
    proxy.events.RewardsAllocated({ fromBlock: 'latest' })
      .on('data', (log) => {
        const { returnValues: { _farmer, _allocated } } = log
        if (farmerAddresses.includes(_farmer) && allocation.indexOf(_allocated) === farmerAddresses.indexOf(_farmer)) {
          count ++
          allocated += parseInt(token.constrainTokenValue(_allocated))
          if (3 === count) {
            ctx.close()
            resolve()
          }
        }
      })
  })
  t.is(allocated, 100)
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

test.serial('getBudget(opts) and getJobOwner(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid(t)

  for (const func of funcMap) {
    await t.throwsAsync(func(), TypeError)
    await t.throwsAsync(func({ }), TypeError)
    await t.throwsAsync(func(''), TypeError)
    await t.throwsAsync(func('opts'), TypeError)
    await t.throwsAsync(func(true), TypeError)
    await t.throwsAsync(func(123), TypeError)

    await t.throwsAsync(func({ contentDid }), TypeError)
    await t.throwsAsync(func({ contentDid: '' }), TypeError)
    await t.throwsAsync(func({ contentDid: 'did:ara:invalid' }), Error)
    await t.throwsAsync(func({ contentDid: { } }), TypeError)
    await t.throwsAsync(func({ contentDid: 123 }), TypeError)
    await t.throwsAsync(func({ contentDid: true }), TypeError)

    await t.throwsAsync(func({ contentDid, jobId: null }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: '' }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: 'invalid' }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: 123 }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: true }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: { } }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: '0x0' }), TypeError)
    await t.throwsAsync(func({ contentDid, jobId: `${VALID_JOBID}morechars` }), TypeError)
  }
})
