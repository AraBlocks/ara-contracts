const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { randomBytes } = require('ara-crypto')
const { isValidJobId } = require('./util')
const token = require('./token')

const {
  AID_PREFIX,
  JOB_ID_LENGTH
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

  let jobId
  let budget
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
    if (JOB_ID_LENGTH === jobId.length) {
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
  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  try {
    await checkLibrary({ requesterDid: did, contentDid })

    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    let price = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'price_'
    })

    price = Number(token.constrainTokenValue(price))
    let val = job
      ? price + budget
      : price
    val = val.toString()

    let receipt = await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val
    })

    if (receipt.status) {
      // 45353 gas
      debug('gas used', receipt.gasUsed)
    }

    budget = token.expandTokenValue(budget.toString())

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

    const proxyContract = await contract.get(afsAbi, proxy)
    await proxyContract.events.Purchased({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _purchaser, _did } } = log
        debug(_purchaser, 'purchased', _did)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    await proxyContract.events.BudgetSubmitted({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _did, _jobId, _budget } } = log
        debug('job', _jobId, 'submitted in', _did, 'with budget', token.constrainTokenValue(_budget))
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    receipt = await tx.sendSignedTransaction(purchaseTx)
    if (receipt.status) {
      // 211296 gas
      debug('gas used', receipt.gasUsed)
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
