const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:rewards')
const { hasPurchased } = require('./library')
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
  getIdentifier,
  getAddressFromDID,
  web3: {
    tx,
    call,
    account,
    contract,
    isAddress
  },
  transform: {
    toHexString
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
 * @param  {String|Buffer}  opts.job.jobId
 * @param  {Number}         opts.job.budget
 * @param  {Boolean}        [opts.estimate]
 * @param  {Object}         [opts.keyringOpts]
 * @param  {Number}         [opts.gasPrice]
 * @param  {Function}       [opts.onhash]
 * @param  {Function}       [opts.onreceipt]
 * @param  {Function}       [opts.onconfirmation]
 * @param  {Function}       [opts.onerror]
 * @param  {Function}       [opts.onmined]
 * @returns {Object}
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
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw TypeError('Expecting opts.estimate to be of type boolean')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  const {
    requesterDid,
    gasPrice = 0,
    keyringOpts,
    password,
    job,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
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
    jobId = toHexString(jobId, { encoding: 'string' !== typeof jobId ? 'utf8' : 'hex', ethify: true })
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

  contentDid = getIdentifier(contentDid)

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  const estimate = opts.estimate || false

  debug(`${did} submitting ${budget} Ara as rewards for ${jobId} in ${contentDid}`)

  // make sure user hasn't already purchased
  const purchased = await hasPurchased({ contentDid, purchaserDid: did })
  if (!purchased) {
    throw new Error(`${did} has not purchased AFS ${contentDid}, cannot submit budget.`)
  }

  let receipt
  try {
    // proxyExists is checked in hasPurchased
    const proxy = await getProxyAddress(contentDid)

    budget = budget.toString()

    receipt = await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val: budget,
      gasPrice,
      estimate
    })

    if ('object' === typeof receipt && receipt.status) {
      // 30225 gas
      debug('gas used', receipt.gasUsed)
    }

    const val = token.expandTokenValue(budget)

    const { tx: submitTx, ctx: ctx1 } = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      gasPrice,
      data: {
        abi: afsAbi,
        functionName: 'submitBudget',
        values: [
          jobId,
          val
        ]
      }
    })

    if (estimate) {
      const cost = tx.estimateCost(submitTx)
      ctx1.close()
      return Number(cost) + Number(receipt)
    }

    const { contract: proxyContract, ctx: ctx2 } = await contract.get(afsAbi, proxy)
    receipt = await new Promise((resolve, reject) => {
      tx.sendSignedTransaction(
        submitTx,
        {
          onhash,
          onreceipt: (r) => {
            if ('function' === typeof onreceipt) onreceipt(r)
            resolve(r)
          },
          onconfirmation,
          onerror,
          onmined
        }
      )
      proxyContract.events.BudgetSubmitted({ fromBlock: 'latest' })
        .on('data', (log) => {
          const { returnValues: { _did, _jobId, _budget } } = log
          if (_jobId === jobId) {
            debug(`budgetted ${token.constrainTokenValue(_budget)} Ara for job ${_jobId} in ${_did}`)
          }
        })
        .on('error', log => reject(log))
    })
    ctx2.close()
    ctx1.close()
    if (receipt.status) {
      // 54073 gas
      debug('gas used', receipt.gasUsed)
    }
  } catch (err) {
    throw err
  }
  return receipt
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
 * @param  {Boolean}        [opts.estimate]
 * @param  {Object}         [opts.keyringOpts]
 * @param  {Number}         [opts.gasPrice]
 * @param  {Function}       [opts.onhash]
 * @param  {Function}       [opts.onreceipt]
 * @param  {Function}       [opts.onconfirmation]
 * @param  {Function}       [opts.onerror]
 * @param  {Function}       [opts.onmined]
 * @returns {Object}
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
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw TypeError('Expecting opts.estimate to be of type boolean')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  const {
    requesterDid,
    gasPrice = 0,
    keyringOpts,
    password,
    job,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  const { farmers, rewards } = job
  let { jobId } = job

  const validJobId = isValidJobId(jobId)
  if (!validJobId) {
    throw TypeError('Invalid job Id.')
  }
  if (JOB_ID_LENGTH === jobId.length) {
    jobId = toHexString(jobId, { encoding: 'string' !== typeof jobId ? 'utf8' : 'hex', ethify: true })
  }

  // Convert farmer DIDs to Addresses
  const validFarmers = await isValidArray(farmers, async (farmer, index) => {
    try {
      farmers[index] = await getAddressFromDID(farmer, keyringOpts)
    } catch (err) {
      return false
    }
    return isAddress(farmers[index])
  })
  if (!validFarmers) {
    throw new TypeError('Invalid farmer array.')
  }

  // Expand token values
  const validRewards = await isValidArray(rewards, async (reward, index) => {
    if (reward > 0) {
      try {
        rewards[index] = token.expandTokenValue(reward.toString())
      } catch (err) {
        return false
      }
      return true
    }
    return false
  })
  if (!validRewards) {
    throw TypeError('Invalid reward array')
  }

  if (farmers.length !== rewards.length) {
    throw Error('Farmers and rewards array length mismatch.')
  }

  let { contentDid } = opts
  contentDid = getIdentifier(contentDid)

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
  const estimate = opts.estimate || false

  // make sure user hasn't already purchased
  const purchased = await hasPurchased({ contentDid, purchaserDid: did })
  if (!purchased) {
    throw new Error(`${did} has not purchased AFS ${contentDid}, cannot submit budget.`)
  }

  const jobOwner = await getJobOwner({ contentDid, jobId })
  if (jobOwner !== acct.address) {
    throw new Error(`requester address ${acct.address} did not match job owner ${jobOwner}.`)
  }

  debug(did, 'allocating rewards for job:', jobId)

  try {
    const proxy = await getProxyAddress(contentDid)
    const { tx: allocateTx, ctx: ctx1 } = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 4000000,
      gasPrice,
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

    if (estimate) {
      const cost = tx.estimateCost(allocateTx)
      ctx1.close()
      return cost
    }

    const receipt = await tx.sendSignedTransaction(allocateTx, {
      onhash,
      onreceipt,
      onconfirmation,
      onerror,
      onmined
    })
    ctx1.close()
    if (receipt.status) {
      debug('gas used', receipt.gasUsed)
    }
    return receipt
  } catch (err) {
    throw err
  }
}

/**
 * Redeem balance from AFS contract
 * @param  {Object}   opts
 * @param  {String}   opts.farmerDid
 * @param  {String}   opts.contentDid
 * @param  {String}   opts.password
 * @param  {Boolean}  [opts.estimate]
 * @param  {Object}   [opts.keyringOpts]
 * @param  {Number}   [opts.gasPrice]
 * @param  {Function} [opts.onhash]
 * @param  {Function} [opts.onreceipt]
 * @param  {Function} [opts.onconfirmation]
 * @param  {Function} [opts.onerror]
 * @param  {Function} [opts.onmined]
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
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw TypeError('Expecting opts.estimate to be of type boolean')
  } else if (opts.gasPrice && ('number' !== typeof opts.gasPrice || opts.gasPrice < 0)) {
    throw new TypeError(`Expected 'opts.gasPrice' to be a positive number. Got ${opts.gasPrice}.`)
  }

  let { contentDid } = opts
  const {
    farmerDid,
    password,
    keyringOpts,
    gasPrice = 0,
    onhash,
    onreceipt,
    onconfirmation,
    onerror,
    onmined
  } = opts

  let did
  try {
    ({ did } = await validate({
      did: farmerDid, password, label: 'rewards', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = getIdentifier(contentDid)

  debug(did, 'redeeming balance from', contentDid)
  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  const estimate = opts.estimate || false

  let balance = 0
  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)

    const { tx: redeemTx, ctx: ctx1 } = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      gasPrice,
      data: {
        abi: afsAbi,
        functionName: 'redeemBalance'
      }
    })

    if (estimate) {
      const cost = tx.estimateCost(redeemTx)
      ctx1.close()
      return cost
    }

    const { contract: proxyContract, ctx: ctx2 } = await contract.get(afsAbi, proxy)
    const { contract: tokenContract, ctx: ctx3 } = await contract.get(tokenAbi, ARA_TOKEN_ADDRESS)
    balance = await new Promise((resolve, reject) => {
      const { web3 } = ctx3
      tx.sendSignedTransaction(redeemTx, {
        onhash,
        onreceipt,
        onconfirmation,
        onerror,
        onmined
      })
      tokenContract.events.Transfer({ fromBlock: 'latest' })
        .on('data', (log) => {
          const { returnValues: { from, to, value } } = log
          if (web3.utils.toChecksumAddress(from) === web3.utils.toChecksumAddress(proxy) && web3.utils.toChecksumAddress(to) === web3.utils.toChecksumAddress(acct.address)) {
            balance = token.constrainTokenValue(value)
            debug(`${balance} Ara transferred from ${from} to ${to}`)
            resolve(balance)
          }
        })
        .on('error', log => reject(log))

      proxyContract.events.InsufficientDeposit({ fromBlock: 'latest' })
        .on('data', (log) => {
          const { returnValues: { _farmer } } = log
          if (web3.utils.toChecksumAddress(_farmer) === web3.utils.toChecksumAddress(acct.address)) {
            debug(`Failed to redeem rewards for ${_farmer} due to insufficient deposit`)
            reject(new Error('Insufficent Deposit'))
          }
        })
        .on('error', log => reject(log))
    })
    ctx3.close()
    ctx2.close()
    ctx1.close()
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

  let { contentDid, jobId } = opts
  contentDid = getIdentifier(contentDid)

  if (JOB_ID_LENGTH === jobId.length) {
    jobId = toHexString(jobId, { encoding: 'string' !== typeof jobId ? 'utf8' : 'hex', ethify: true })
  }

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
 * @param  {Object} [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function getRewardsBalance(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.farmerDid || !opts.farmerDid) {
    throw TypeError('Expecting non-empty farmer DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  }

  const { farmerDid, keyringOpts } = opts
  let { contentDid } = opts
  const did = getIdentifier(farmerDid)

  contentDid = getIdentifier(contentDid)

  const address = await getAddressFromDID(did, keyringOpts)

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

/**
 * Get owner of job
 * @param  {Object}         opts
 * @param  {String}         opts.contentDid
 * @param  {string|Buffer}  opts.jobId
 * @throws {Error,TypeError}
 */
async function getJobOwner(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID')
  } else if (!isValidJobId(opts.jobId)) {
    throw TypeError('Invalid job Id.')
  }

  let { contentDid, jobId } = opts

  contentDid = getIdentifier(contentDid)

  if (JOB_ID_LENGTH === jobId.length) {
    jobId = toHexString(jobId, { encoding: 'string' !== typeof jobId ? 'utf8' : 'hex', ethify: true })
  }

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    const { sender } = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'jobs_',
      arguments: [
        jobId
      ]
    })
    return sender
  } catch (err) {
    throw err
  }
}

module.exports = {
  submit,
  redeem,
  allocate,
  getBudget,
  getJobOwner,
  getRewardsBalance
}
