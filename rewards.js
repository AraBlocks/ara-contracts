const { abi: tokenAbi } = require('./build/contracts/ARAToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:rewards')
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
  isValidJobId
} = require('./util')

/**
 * Submit new job
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Object} opts.job
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
    const validJobId = jobId && isValidJobId(jobId)
    const validBudget = budget && 'number' === typeof budget && budget > 0

    if (!validJobId || validBudget) {
      throw TypeError('ara-contracts.rewards: Expecting job Id and budget.')
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
  debug(did, 'repositing', reward, 'tokens as rewards for', contentDid)

  did = kAidPrefix + did
  const acct = await account.load({ did, password })

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
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Number} opts.reward
 * @throws {Error,TypeError}
 */
async function allocate(opts) {

}

async function claim(opts) {

}

module.exports = {
  claim,
  allocate,
  submitBudget
}
