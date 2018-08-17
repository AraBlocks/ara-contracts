const { abi: tokenAbi } = require('./build/contracts/ARAToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:rewards')
const { web3 } = require('ara-context')()
const { info } = require('ara-console')

const {
  kAidPrefix,
  kARATokenAddress
} = require('./constants')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  tx,
  call,
  account,
  contract
} = require('ara-web3')

const {
  ethify,
  isValidJobId,
  isValidArray
} = require('./util')

/**
 * Submit new job
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @param  {Object}         opts.job
 * @param  {string|Buffer}  opts.job.jobId
 * @param  {number}         opts.job.budget
 * @throws {Error,TypeError}
 */
async function submitBudget(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.rewards: Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty password')
  } else if (opts.job && 'object' !== typeof opts.job) {
    throw TypeError('ara-contracts.rewards: Expecting job object.')
  }

  const {
    requesterDid,
    password,
    job: {
      jobId,
      budget
    }
  } = opts

  if (job) {
    const validJobId = isValidJobId(jobId)
    const validBudget = budget && 'number' === typeof budget && budget > 0

    if (!validJobId) {
      throw TypeError('ara-contracts.rewards: Expecting job Id.')
    }
    if (!validBudget) {
      throw TypeError('ara-contracts.rewards: Expecting budget.')
    }

    if (jobId.length === 64) {
      jobId = ethify(jobId, 'string' !== typeof jobId)
    }
  }

  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'rewards' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  did = kAidPrefix + did
  const acct = await account.load({ did, password })

  debug(did, 'repositing', reward, 'tokens as rewards for', contentDid)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('ara-contracts.rewards: This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const approveTx = await tx.create({
      account: acct,
      to: kARATokenAddress,
      data: {
        abi: tokenAbi,
        functionName: 'approve',
        values: [
          proxy,
          budget
        ]
      }
    })

    await tx.sendSignedTransaction(approveTx)

    const submitTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'submitBudget',
        values: [
          jobId,
          budget
        ]
      }
    })

    const proxyContract = await contract.get(afsAbi, proxy)
    await proxyContract.events.BudgetSubmitted({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _did, _jobId, _budget } } = log
        info(requesterDid, 'budgeted', _budget, 'tokens for job', _jobId)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    await tx.sendSignedTransaction(submitTx)
  }
}

/**
 * Allocate rewards
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @param  {Object}         opts.job
 * @param  {string|Buffer}  opts.job.jobId
 * @param  {Array}          opts.job.farmers   // addresses
 * @param  {Array}          opts.job.rewards
 * @throws {Error,TypeError}
 */
async function allocate(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.rewards: Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty password')
  } else if (opts.job && 'object' !== typeof opts.job) {
    throw TypeError('ara-contracts.rewards: Expecting job object.')
  }

  const {
    requesterDid,
    password,
    job: {
      jobId,
      farmers,
      rewards
    }
  } = opts

  if (job) {
    const validJobId = isValidJobId(jobId)
    const validFarmers = isValidArray(farmers, (address, index) => {
      if (!web3.utils.isAddress(address)) {
        return false
      }
      farmers[index] = web3.utils.soliditySha3({ t: 'address', v: address })
    })
    const validRewards = isValidArray(rewards, (reward) => {
      if (reward <= 0) {
        return false
      }
    })

    if (!validJobId) {
      throw TypeError('ara-contracts.rewards: Expecting job Id.')
    }

    if (!validFarmers || !validRewards || farmers.length !== rewards.length) {
      throw TypeError('ara-contracts.rewards: Expecting farmers and rewards.')
    }

    if (jobId.length === 64) {
      jobId = ethify(jobId, 'string' !== typeof jobId)
    }
  }

  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'rewards' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  did = kAidPrefix + did
  const acct = await account.load({ did, password })

  debug(did, 'allocating rewards for job:', jobId)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('ara-contracts.rewards: This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const submitTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'allocateRewards',
        values: [
          jobId,
          farmers,
          rewards
        ]
      }
    })
  } catch (err) {
    throw err
  }
}

/**
 * Claim rewards
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @throws {Error,TypeError}
 */
async function claim(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.rewards: Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.rewards: Expecting non-empty password')
  }

  const { requesterDid, password } = opts
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'rewards' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did 'claiming rewards for', contentDid)
  did = kAidPrefix + did
  const acct = await account.load({ did, password })

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('ara-contracts.rewards: This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const claimTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'claimRewards'
      }
    })

    const tokenContract = await contract.get(tokenAbi, kARATokenAddress)
    await tokenContract.events.Transfer({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { from, to, value } } = log
        info(to, 'claimed', value, 'rewards from', from)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    await tx.sendSignedTransaction(claimTx)
  } catch (err) {
    throw err
  }
}

module.exports = {
  claim,
  allocate,
  submitBudget
}
