const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
const { AID_PREFIX } = require('./constants')
const { randomBytes } = require('ara-crypto')
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
  getIdentifier,
  web3: {
    tx,
    call,
    account
  },
  transform: {
    toHexString
  }
} = require('ara-util')

/**
 * Purchase contentDid // 256649 gas
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.budget
 * @param  {Boolean} opts.estimate
 * @param  {Object} [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function purchase(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError("Expected 'opts.estimate' to be a boolean")
  } else if (opts.budget && ('number' !== typeof opts.budget || 0 >= opts.budget)) {
    throw TypeError('Expecting budget to be 0 or greater.')
  }

  const {
    requesterDid,
    password,
    keyringOpts
  } = opts

  let { budget, contentDid } = opts
  const estimate = opts.estimate || false

  budget = budget || 0

  const jobId = toHexString(randomBytes(32), { encoding: 'utf8', ethify: true })

  let did
  try {
    ({ did } = await validate({
      did: requesterDid, password, label: 'purchase', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = getIdentifier(contentDid)

  debug(did, 'purchasing', contentDid)

  const hIdentity = hashDID(did)
  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  let load
  let receipt
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
    if (val) {
      val = val.toString()

      load = await token.increaseApproval({
        did,
        password,
        spender: proxy,
        val,
        estimate
      })

      if (load.status) {
        // 45353 gas
        receipt = load
        debug('gas used', receipt.gasUsed)
      }
    }

    budget = token.expandTokenValue(budget.toString())

    const { tx: purchaseTx, ctx } = await tx.create({
      account: acct,
      to: proxy,
      gasLimit: 1000000,
      data: {
        abi: afsAbi,
        functionName: 'purchase',
        values: [
          toHexString(hIdentity, { encoding: 'hex', ethify: true }),
          jobId,
          budget
        ]
      }
    })

    if (estimate) {
      const cost = tx.estimateCost(purchaseTx)
      ctx.close()
      return String(Number(cost) + Number(load))
    }

    receipt = await tx.sendSignedTransaction(purchaseTx)
    ctx.close()
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

  return {
    receipt,
    jobId
  }
}

module.exports = {
  purchase
}
