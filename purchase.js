const { abi: tokenAbi } = require('./build/contracts/ARAToken.json')
const { abi: libAbi } = require('./build/contracts/library.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { info } = require('ara-console')

const {
  kAidPrefix,
  kLibraryAddress,
  kARATokenAddress
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
  normalize
} = require('ara-util')

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
 * Purchase contentDid
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
    job: {
      jobId,
      budget
    }
  } = opts

  if (job) {
    const validJobId = jobId && isValidJobId(jobId)
    const validBudget = budget && 'number' === typeof budget && budget > 0

    if (!validJobId || validBudget) {
      throw TypeError('Expecting job Id and budget.')
    }

    if (jobId.length === 64) {
      jobId = ethify(jobId, 'string' !== typeof jobId)
    }
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
  did = kAidPrefix + did
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

    const approveTx = await tx.create({
      account: acct,
      to: kARATokenAddress,
      data: {
        abi: tokenAbi,
        functionName: 'approve',
        values: [
          proxy,
          job ? price + budget : price
        ]
      }
    })

    await tx.sendSignedTransaction(approveTx)

    const purchaseTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'purchase',
        values: [
          ethify(hIdentity),
          job ? jobId : ethify(Buffer.alloc(32), true),
          job ? budget : 0
        ]
      }
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

    await tx.sendSignedTransaction(purchaseTx)

    const size = await getLibrarySize(did)

    const contentId = await getLibraryItem(did, size - 1)

    info(contentId, `added to library (${size})`)
  } catch (err) {
    throw err
  }
}

module.exports = {
  purchase
}
