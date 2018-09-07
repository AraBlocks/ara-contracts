const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const { abi: libAbi } = require('./build/contracts/library.json')
const { abi: jobsAbi } = require('./build/contracts/Jobs.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { randomBytes } = require('ara-crypto')
const { info } = require('ara-console')
const token = require('./token')

const {
  kAidPrefix,
  kLibraryAddress,
  kJobsAddress,
  kAraTokenAddress
} = require('./constants')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  checkLibrary,
  getLibrarySize,
  getLibraryItem
} = require('./library')

const {
  hashDID,
  validate,
  normalize,
  web3: {
    tx,
    call,
    ethify,
    account,
    contract
  }
} = require('ara-util')

const {
  isValidJobId
} = require('./util')

/**
 * Purchase contentDid // 256649 gas
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Object} opts.job
 * @throws {Error,TypeError}
 */
async function purchase(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(' Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.job && 'object' !== typeof opts.job) {
    throw TypeError('Expecting job object.')
  }

  const {
    requesterDid,
    password,
    job
  } = opts

  let jobId, budget
  if (job) {
    ({ jobId, budget } = job)
    const validJobId = jobId && isValidJobId(jobId)
    const validBudget = 'number' === typeof budget && 0 <= budget

    if (!validJobId) {
      throw TypeError('Expecting job Id.')
    }
    if (!validBudget) {
      throw TypeError('Expecting budget.')
    }

    if (jobId.length === 64) {
      jobId = ethify(jobId, 'string' !== typeof jobId)
    }
  } else {
    jobId = ethify(randomBytes(32), true)
    budget = 0
  }

  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'purchase' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did, 'purchasing', contentDid)

  const hIdentity = hashDID(did)
  did = `${kAidPrefix}${did}`
  const acct = await account.load({ did, password })

  try {
    await checkLibrary({ requesterDid: did, contentDid })

    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    const price = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'price_'
    })

    const val = job ? price + budget : price

    const approveTx = await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val: val.toString()
    })    

    if (approveTx.status) {
      // 45353 gas
      debug('gas used', approveTx.gasUsed)
    }

    const jobsContract = await contract.get(jobsAbi, kJobsAddress)
    // event listeners
    // TODO(cckelly) most of these callbacks are the same, should be passing in callback function
    await jobsContract.events.BudgetSubmitted({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _jobId, _budget } } = log
        debug('job', _jobId, 'submitted with budget', _budget)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    await jobsContract.events.Unlocked({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _jobId } } = log
        debug('unlocked job', _jobId)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const proxyContract = await contract.get(afsAbi, proxy)
    await proxyContract.events.Purchased({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _purchaser, _did } } = log
        debug(_purchaser, "purchased", _did)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    debug('before purchase tx, jobId', jobId, ', budget:', budget)

    debug('balance of master account', await token.balanceOf(acct.address))
    debug('balance of AFS owner', await token.balanceOf('0x490E4Cd31DeB1f988740d5f19034deDf1202FEeC'))
    debug('proxy allowance', await token.allowance({ spender: proxy, owner: acct.address }))

    const tokenContract = await contract.get(tokenAbi, kAraTokenAddress)
    await tokenContract.events.Transfer({ fromBlock: 'latest', function(error) { debug(error)} })
      .on('data', (log) => {
        debug('transfer!!')
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    const purchaseTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'purchase',
        values: [
          ethify(hIdentity),
          jobId,
          budget
        ]
      }
    })

    const receipt2 = await tx.sendSignedTransaction(purchaseTx)
    if (receipt2.status) {
      // 211296 gas
      debug('gas used', receipt2.gasUsed)
      const size = await getLibrarySize(did)

      const contentId = await getLibraryItem({ requesterDid: did, index: size - 1 })

      debug(contentId, `added to library (${size})`)
    }
  } catch (err) {
    throw err
  }
}

module.exports = {
  purchase
}
