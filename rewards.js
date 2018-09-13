const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:rewards')
const { info } = require('ara-console')
const token = require('./token')

const {
  AID_PREFIX,
  ARA_TOKEN_ADDRESS
} = require('./constants')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  hashDID,
  validate,
  normalize,
  web3: {
    tx,
    sha3,
    call,
    ethify,
    account,
    contract,
    isAddress
  }
} = require('ara-util')

const {
  isValidJobId,
  isValidArray
} = require('./util')

/**
 * Submits a new DCDN job // 84298 gas
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @param  {Object}         opts.job
 * @param  {string|Buffer}  opts.job.jobId
 * @param  {number}         opts.job.budget
 * @throws {Error,TypeError}
 */
async function submit(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.job || 'object' !== typeof opts.job) {
    throw TypeError('Expecting job object.')
  }

  const {
    requesterDid,
    password,
    job
  } = opts

  const { jobId } = job
  let { budget } = job

  const validJobId = isValidJobId(jobId)
  const validBudget = budget && 'number' === typeof budget && budget > 0

  if (!validJobId) {
    throw TypeError('Expecting job Id.')
  }
  if (!validBudget) {
    throw TypeError('Expecting budget.')
  }

  if (jobId.length === 64) {
    jobId = ethify(jobId, 'string' !== typeof jobId)
  }

  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'rewards' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  debug(did, 'submitting', budget, 'tokens as rewards for', contentDid)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    budget = budget.toString()

    const approveTx = await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val: budget
    })

    const receipt1 = await tx.sendSignedTransaction(approveTx)
    if (receipt1.status) {
      // 30225 gas
      debug('gas used', receipt1.gasUsed)
    }

    const val = token.expandTokenValue(budget)

    const submitTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'submitBudget',
        values: [
          jobId,
          val
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

    const receipt2 = await tx.sendSignedTransaction(submitTx)
    if (receipt2.status) {
      // 54073 gas
      debug('gas used', receipt2.gasUsed)
    }
  } catch (err) {
    throw err
  }
}

/**
 * Allocates rewards for job // 163029 gas (with return), 69637 gas (without return)
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
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.job || 'object' !== typeof opts.job) {
    throw TypeError('Expecting job object.')
  }

  const {
    requesterDid,
    password,
    job
  } = opts

  const {
    jobId,
    farmers,
  } = job

  let { rewards } = job

  const validJobId = isValidJobId(jobId)
  const validFarmers = isValidArray(farmers, (address, index) => {
    if (!isAddress(address)) {
      return false
    }
    farmers[index] = sha3({ t: 'address', v: address })
  })
  const validRewards = isValidArray(rewards, (reward) => {
    if (reward <= 0) {
      return false
    }
  })

  if (!validJobId) {
    throw TypeError('Expecting job Id.')
  }

  if (!validFarmers || !validRewards || farmers.length !== rewards.length) {
    throw TypeError('Expecting farmers and rewards.')
  }

  if (jobId.length === 64) {
    jobId = ethify(jobId, 'string' !== typeof jobId)
  }
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'rewards' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  debug(did, 'allocating rewards for job:', jobId)

  rewards = rewards.map(i => token.expandTokenValue(i))

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    const allocateTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 4000000,
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
    const proxyContract = await contract.get(afsAbi, proxy)
    await proxyContract.events.RewardsAllocated({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _did, _allocated, _returned } } = log
        info('allocated', _allocated, 'tokens as rewards between farmers and returned', _returned, 'tokens')
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const receipt = await tx.sendSignedTransaction(allocateTx)
    if (receipt.status) {
      debug('gas used', receipt.gasUsed)
    }
  } catch (err) {
    throw err
  }
}

/**
 * Redeem balance from AFS contract
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @throws {Error,TypeError}
 */
async function redeem(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
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

  debug(did, 'redeeming balance from', contentDid)
  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const redeemTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'redeemBalance'
      }
    })

    let balance
    const tokenContract = await contract.get(tokenAbi, ARA_TOKEN_ADDRESS)
    await tokenContract.events.Transfer({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { from, to, value } } = log
        balance = value
        info(to, 'redeemed', value, 'tokens from', from)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const receipt = await tx.sendSignedTransaction(redeemTx)

    if (receipt.status) {
      debug('gas used', receipt.gasUsed)
      return balance
    }
  } catch (err) {
    throw err
  }
}

/**
 * Get budget for job
 * @param  {Object}         opts
 * @param  {String}         opts.contentDid
 * @param  {string|Buffer}  opts.jobId
 * @throws {Error,TypeError}
 */
async function getBudget(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if (!isValidJobId(opts.jobId)) {
    throw TypeError('Expecting valid jobId.')
  }

  const { jobId } = opts
  let { contentDid } = opts
  contentDid = normalize(contentDid)

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    const budget = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'getBudget',
      arguments: [
        jobId
      ]
    })
    return budget
  } catch (err) {
    throw err
  }
}

/**
 * Get user balance
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @throws {Error,TypeError}
 */
async function getBalance(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
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

  did = `${AID_PREFIX}${did}`
  const { address } = await account.load({ did, password })

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    const budget = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'getBalance',
      arguments: [
        address
      ]
    })
    return budget
  } catch (err) {
    throw err
  }
}

module.exports = {
  submit,
  redeem,
  allocate,
  getBudget,
  getBalance
}
