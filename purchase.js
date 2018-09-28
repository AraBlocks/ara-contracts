const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { randomBytes } = require('ara-crypto')
const { AID_PREFIX } = require('./constants')
const token = require('./token')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  hasPurchased,
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
 * @param  {Number} opts.budget
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
  } else if ('number' !== typeof opts.budget || 0 > opts.budget) {
    throw TypeError('Expecting budget to be 0 or greater.')
  }

  const {
    requesterDid,
    password
  } = opts

  let { budget } = opts

  const jobId = ethify(randomBytes(32), true)
  budget = budget || 0

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

  let result
  try {
    const purchased = await hasPurchased({ purchaserDid: did, contentDid })
    if (purchased) {
      throw new Error('Identity has already purchased this')
    }

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

    let val = budget + price
    val = val.toString()

    await token.increaseApproval({
      did,
      password,
      spender: proxy,
      val
    })

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
    await proxyContract.events.Purchased({ fromBlock: 'latest' }).on('data', log => onpurchased(log))
    await proxyContract.events.BudgetSubmitted({ fromBlock: 'latest' }).on('data', log => onbudgetsubmitted(log))

    result = tx.sendSignedTransaction(purchaseTx)
    
  } catch (err) {
    throw err
  }

  return result

  function onpurchased(log) {
    const { returnValues: { _purchaser, _did } } = log
    debug(_purchaser, 'purchased', _did) 
  }

  function onbudgetsubmitted(log) {
    const { returnValues: { _did, _jobId, _budget } } = log
    debug('job', _jobId, 'submitted in', _did, 'with budget', token.constrainTokenValue(_budget))
  }

}

module.exports = {
  purchase
}
