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
  getAddressFromDID,
  web3: {
    tx,
    call,
    sha3,
    ethify,
    account,
    contract
  }
} = require('ara-util')

/**
 * Purchase contentDid // 256649 gas
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Number}  opts.budget
 * @param  {?String} [opts.seller]
 * @throws {Error,TypeError}
 */
async function purchase(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(' Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw new TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.budget || 0 > opts.budget) {
    throw new TypeError('Expecting budget to be 0 or greater.')
  } else if (opts.seller && 'string' !== typeof opts.seller) {
    throw new TypeError(`Expecting 'opts.seller' to be a string. Got ${opts.seller}. Ensure ${opts.seller} is a valid AraID.`)
  }

  const quantity = Number(opts.quantity) || 1

  if (!Number.isInteger(quantity)) {
    throw new Error(`Expecting quantity to be a whole number. Got ${quantity}. Try passing 'opts.quantity' as a whole number.`)
  }

  const {
    requesterDid,
    password,
    seller
  } = opts

  let { budget } = opts

  let resale = false
  let sellerAddress
  if (seller) {
    try {
      sellerAddress = await getAddressFromDID(seller)
      resale = true
    } catch (err) {
      throw err
    }
  }

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

  try {
    if (!(await proxyExists(contentDid))) {
      throw new Error('This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    let price
    if (resale) {
      price = await call({
        abi: afsAbi,
        address: proxy,
        functionName: 'purchasers_',
        arguments: [
          sha3({ t: 'address', v: seller })
        ]
      })[1]
    } else {
      price = await call({
        abi: afsAbi,
        address: proxy,
        functionName: 'getPrice',
        arguments: [
          quantity
        ]
      })
    }

    price = Number(token.constrainTokenValue(price))

    let val = budget + price
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

    let values = [ethify(hIdentity), jobId, budget]
    if (resale) {
      values.unshift(seller)
    }

    const purchaseTx = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: resale ? 'purchaseResale' : 'purchase',
        values
      }
    })

    const proxyContract = await contract.get(afsAbi, proxy)
    const eventName = resale ? 'PurchasedResale' : 'Purchased'
    await proxyContract.events[`${eventName}`]({ fromBlock: 'latest', function(error) { debug(error) } })
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
