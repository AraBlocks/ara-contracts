const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:rewards')
const { info } = require('ara-console')
const token = require('./token')

const {
  ARA_TOKEN_ADDRESS,
  JOB_ID_LENGTH,
  AID_PREFIX
} = require('./constants')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  validate,
  normalize,
  getAddressFromDID,
  web3: {
    tx,
    call,
    sha3,
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
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.job || 'object' !== typeof opts.job) {
    throw TypeError('Expecting job object.')
  }

  const {
    requesterDid,
    keyringOpts,
    password,
    job
  } = opts

  let { budget, jobId } = job

  const validJobId = isValidJobId(jobId)
  if ('string' === typeof budget) {
    budget = parseInt(budget, 10)
  }
  const validBudget = budget && 'number' === typeof budget && budget > 0

  if (!validJobId) {
    throw TypeError('Expecting job Id.')
  }
  if (!validBudget) {
    throw TypeError('Expecting budget.')
  }

  if (JOB_ID_LENGTH === jobId.length) {
    jobId = ethify(jobId, 'string' !== typeof jobId)
  }

  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({
      did: requesterDid, password, label: 'rewards', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  debug(`${did} submitting ${budget} Ara as rewards for ${jobId} in ${contentDid}`)

  let receipt
  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    budget = budget.toString()

    receipt = await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val: budget
    })

    if (receipt.status) {
      // 30225 gas
      debug('gas used', receipt.gasUsed)
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
        info(`budgetted ${token.constrainTokenValue(_budget)} Ara for job ${_jobId} in ${_did}`)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    receipt = await tx.sendSignedTransaction(submitTx)
    if (receipt.status) {
      // 54073 gas
      debug('gas used', receipt.gasUsed)
    }
  } catch (err) {
    throw err
  }
  return { jobId, receipt }
}

/**
 * Allocates rewards for job // 163029 gas (with return), 69637 gas (without return)
 * @param  {Object}         opts
 * @param  {String}         opts.requesterDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @param  {Object}         opts.job
 * @param  {string|Buffer}  opts.job.jobId
 * @param  {Array}          opts.job.farmers
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
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  } else if (!opts.job || 'object' !== typeof opts.job) {
    throw TypeError('Expecting job object.')
  }

  const {
    requesterDid,
    keyringOpts,
    password,
    job
  } = opts

  const { farmers, rewards } = job
  let { jobId } = job

  const validJobId = isValidJobId(jobId)
  if (!validJobId) {
    throw TypeError('Invalid job Id.')
  }
  if (JOB_ID_LENGTH === jobId.length) {
    jobId = ethify(jobId, 'string' !== typeof jobId)
  }

  // Convert farmer DIDs to Addresses
  const validFarmers = await isValidArray(farmers, async (farmer, index) => {
    const address = await getAddressFromDID(farmer)
    farmers[index] = sha3({ t: 'address', v: address })
    return isAddress(address)
  })
  if (!validFarmers) {
    throw TypeError('Invalid farmer array.')
  }

  // Expand token values
  const validRewards = await isValidArray(rewards, async (reward, index) => {
    if (reward > 0) {
      rewards[index] = token.expandTokenValue(reward.toString())
      return true
    }
    return false
  })
  if (!validRewards) {
    throw TypeError('Invalid reward array')
  }

  if (farmers.length !== rewards.length) {
    throw TypeError('Farmers and rewards array length mismatch.')
  }

  let { contentDid } = opts
  contentDid = normalize(contentDid)

  let did
  try {
    ({ did } = await validate({
      did: requesterDid, password, label: 'rewards', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  did = `${AID_PREFIX}${did}`

  const acct = await account.load({ did, password })

  debug(did, 'allocating rewards for job:', jobId)

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
        info(`allocated ${token.constrainTokenValue(_allocated)} Ara as rewards between farmers for content ${_did}; returned ${_returned} Ara`)
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
 * @param  {String}         opts.farmerDid
 * @param  {String}         opts.contentDid
 * @param  {String}         opts.password
 * @throws {Error,TypeError}
 */
async function redeem(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.farmerDid || !opts.farmerDid) {
    throw TypeError('Expecting non-empty farmer DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  }

  const { farmerDid, password, keyringOpts } = opts
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({
      did: farmerDid, password, label: 'rewards', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did, 'redeeming balance from', contentDid)
  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  let balance = 0
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

    const tokenContract = await contract.get(tokenAbi, ARA_TOKEN_ADDRESS)
    await tokenContract.events.Transfer({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { from, to, value } } = log
        balance = value
        info(`${to} redeemed ${token.constrainTokenValue(value)} Ara from ${from}`)
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
    }
  } catch (err) {
    throw err
  }
  return balance
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
    return token.constrainTokenValue(budget)
  } catch (err) {
    throw err
  }
}

/**
 * Get user balance
 * @param  {Object} opts
 * @param  {String} opts.farmerDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @throws {Error,TypeError}
 */
async function getRewardsBalance(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.farmerDid || !opts.farmerDid) {
    throw TypeError('Expecting non-empty farmer DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password')
  }

  const { farmerDid, password, keyringOpts } = opts
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({
      did: farmerDid, password, label: 'rewards', keyringOpts
    }))
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
    const balance = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'getRewardsBalance',
      arguments: [
        address
      ]
    })
    return token.constrainTokenValue(balance)
  } catch (err) {
    throw err
  }
}

module.exports = {
  submit,
  redeem,
  allocate,
  getBudget,
  getRewardsBalance
}
