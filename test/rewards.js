/* eslint-disable object-curly-newline */
/* eslint-disable no-await-in-loop */

const { rewards, purchase, registry, token } = require('../')
const { abi } = require('../build/contracts/AFS.json')
const test = require('ava')

const {
  TEST_OWNER_DID,
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
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID)
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID3)
  t.context.farmerAccount1 = await mirrorIdentity(TEST_FARMER_DID1)
  t.context.farmerAccount2 = await mirrorIdentity(TEST_FARMER_DID2)
  t.context.farmerAccount3 = await mirrorIdentity(TEST_FARMER_DID3)

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

test.serial('getRewardsBalance(opts) no proxy', async (t) => {
  const farmerDid = TEST_FARMER_DID1
  const contentDid = getAfsDid(t)

  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid }), Error)
})

test.serial('redeem(opts) no proxy', async (t) => {
  const farmerDid = TEST_FARMER_DID1
  const contentDid = getAfsDid(t)

  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password }))
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
  t.is(jobOwner.toLowerCase(), TEST_OWNER_ADDRESS)
})

test.serial('allocate(opts) not purchased', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = TEST_FARMER_DID1
  const farmers = [ TEST_FARMER_DID1, TEST_FARMER_DID2, TEST_FARMER_DID3 ]
  const allocation = [ '20', '30', '50' ]

  await t.throwsAsync(rewards.allocate({
    requesterDid,
    contentDid,
    password,
    job: {
      jobId,
      farmers,
      rewards: allocation
    }
  }), Error)
})

test.serial('allocate(opts) not job owner', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = TEST_FARMER_DID1
  const farmers = [ TEST_FARMER_DID1, TEST_FARMER_DID2, TEST_FARMER_DID3 ]
  const allocation = [ '20', '30', '50' ]

  await purchase({
    requesterDid,
    contentDid,
    password
  })

  await t.throwsAsync(rewards.allocate({
    requesterDid,
    contentDid,
    password,
    job: {
      jobId,
      farmers,
      rewards: allocation
    }
  }), Error)
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
  await new Promise((resolve) => {
    console.log('allocating for farmers with deposits')
    rewards.allocate({
      requesterDid,
      contentDid,
      password,
      job: {
        jobId,
        farmers,
        rewards: allocation
      }
    }).catch(err => console.log('failed here', err.message))
    proxy.events.RewardsAllocated({ fromBlock: 'latest' })
      .on('data', (log) => {
        const { returnValues: { _farmer, _allocated } } = log
        if (farmerAddresses.includes(_farmer) && allocation.indexOf(_allocated) === farmerAddresses.indexOf(_farmer)) {
          count++
          allocated += parseInt(token.constrainTokenValue(_allocated), 10)
          if (3 === count) {
            ctx.close()
            resolve()
          }
        } else {
          t.fail()
        }
      })
  })
  t.is(allocated, 100)
})

test.serial('getRewardsBalance(opts)', async (t) => {
  const contentDid = getAfsDid(t)

  const farmer1Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID1, contentDid })
  t.is(farmer1Balance, '20')

  const farmer2Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID2, contentDid })
  t.is(farmer2Balance, '30')

  const farmer3Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID3, contentDid })
  t.is(farmer3Balance, '50')
})

test.serial('redeem(opts) insufficient deposit', async (t) => {
  const contentDid = getAfsDid(t)
  await token.modifyDeposit({
    did: TEST_FARMER_DID2,
    password,
    val: '100',
    withdraw: true
  })
  const amountDeposited = await token.getAmountDeposited(TEST_FARMER_DID2)
  t.is(amountDeposited, '0')

  await t.throwsAsync(rewards.redeem({ farmerDid: TEST_FARMER_DID2, contentDid, password }), Error)
})

test.serial('redeem(opts)', async (t) => {
  const contentDid = getAfsDid(t)

  await token.modifyDeposit({
    did: TEST_FARMER_DID2,
    password,
    val: '100'
  })
  const amountDeposited = await token.getAmountDeposited(TEST_FARMER_DID2)
  t.is(amountDeposited, '100')

  const cost = await rewards.redeem({
    farmerDid: TEST_FARMER_DID1,
    contentDid,
    password,
    estimate: true
  })
  t.true(cost > 0)

  let farmer1Balance = await rewards.redeem({ farmerDid: TEST_FARMER_DID1, contentDid, password })
  t.is(farmer1Balance, '20')
  farmer1Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID1, contentDid })
  t.is(farmer1Balance, '0')

  let farmer2Balance = await rewards.redeem({ farmerDid: TEST_FARMER_DID2, contentDid, password })
  t.is(farmer2Balance, '30')
  farmer2Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID2, contentDid })
  t.is(farmer2Balance, '0')

  let farmer3Balance = await rewards.redeem({ farmerDid: TEST_FARMER_DID3, contentDid, password })
  t.is(farmer3Balance, '50')
  farmer3Balance = await rewards.getRewardsBalance({ farmerDid: TEST_FARMER_DID3, contentDid })
  t.is(farmer3Balance, '0')
})

test.serial('redeem(opts) invalid opts', async (t) => {
  const farmerDid = TEST_FARMER_DID1
  const contentDid = getAfsDid(t)

  await t.throwsAsync(rewards.redeem(), TypeError)
  await t.throwsAsync(rewards.redeem({ }), TypeError)
  await t.throwsAsync(rewards.redeem(''), TypeError)
  await t.throwsAsync(rewards.redeem('opts'), TypeError)
  await t.throwsAsync(rewards.redeem(true), TypeError)
  await t.throwsAsync(rewards.redeem(123), TypeError)

  await t.throwsAsync(rewards.redeem({ farmerDid }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid: '' }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.redeem({ farmerDid: { } }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid: 123 }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid: true }), TypeError)

  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid: '' }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid: 'did:ara:invalid' }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid: { } }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid: true }), TypeError)

  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password: '' }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password: 'wrong' }), Error)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password: 123 }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password: { } }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password: true }), TypeError)

  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password, estimate: { } }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password, estimate: 'notaboolean' }), TypeError)
  await t.throwsAsync(rewards.redeem({ farmerDid, contentDid, password, estimate: 123 }), TypeError)
})

test.serial('getRewardsBalance(opts) invalid opts', async (t) => {
  const farmerDid = TEST_FARMER_DID1

  await t.throwsAsync(rewards.getRewardsBalance(), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance(''), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance('opts'), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance(true), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance(123), TypeError)

  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid: '' }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid: { } }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid: 123 }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid: true }), TypeError)

  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid: '' }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid: { } }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(rewards.getRewardsBalance({ farmerDid, contentDid: true }), TypeError)
})

test.serial('allocate(opts) invalid opts', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  await t.throwsAsync(rewards.allocate(), TypeError)
  await t.throwsAsync(rewards.allocate({ }), TypeError)
  await t.throwsAsync(rewards.allocate(''), TypeError)
  await t.throwsAsync(rewards.allocate('opts'), TypeError)
  await t.throwsAsync(rewards.allocate(true), TypeError)
  await t.throwsAsync(rewards.allocate(123), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid: '' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid: 'did:ara:invalid' }), Error)
  await t.throwsAsync(rewards.allocate({ requesterDid: { } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid: 123 }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid: true }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid: '' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid: 'did:ara:invalid' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid: { } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid: 123 }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid: true }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password: '' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password: 'wrong' }), Error)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password: 123 }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password: { } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password: true }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: null }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: '' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: 'string' }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: 123 }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: true }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { } }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: null } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: '' } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: 'invalid' } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: 123 } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: true } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: { } } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: '0x0' } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: `${VALID_JOBID}morechars` } }), TypeError)
})

test.serial('allocate(opts) invalid job object', async (t) => {
  const contentDid = getAfsDid(t)
  const requesterDid = getDid(t)

  const validFarmers4 = [ TEST_FARMER_DID1, TEST_FARMER_DID2, TEST_FARMER_DID3, TEST_OWNER_DID ]
  const validRewards3 = [ 20, 30, 50 ]
  const validRewards4 = [ 20, 30, 50, 100 ]
  const invalidFarmers = [ '0x0', '123', 123, 'did:ara:invalid' ]
  const invalidRewards = [ -1, 'h', true ]

  // slice arrays to pass by value
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0), rewards: validRewards3.slice(0) } }), Error)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0) } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: invalidFarmers.slice(0) } }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0), rewards: invalidRewards.slice(0) } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: invalidFarmers.slice(0), rewards: validRewards3.slice(0) } }), TypeError)

  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0), rewards: validRewards4.slice(0), returnBudget: { } } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0), rewards: validRewards4.slice(0), returnBudget: 'notaboolean' } }), TypeError)
  await t.throwsAsync(rewards.allocate({ requesterDid, contentDid, password, job: { jobId: VALID_JOBID, farmers: validFarmers4.slice(0), rewards: validRewards4.slice(0), returnBudget: 123 } }), TypeError)
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
