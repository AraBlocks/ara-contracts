const { abi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:price')
const { AID_PREFIX } = require('./constants')
const token = require('./token')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  getDocumentOwner,
  validate,
  web3: {
    tx,
    call,
    account
  }
} = require('ara-util')

/**
 * Estimates the gas cost setting the price
 * @param {Object}   opts
 * @param {String}   opts.did
 * @param {String}   opts.password
 * @param {Number}   opts.quantity
 * @param {Number}   opts.price
 */
async function estimateSetPriceGasCost(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.did || !opts.did) {
    throw new TypeError('Expecting non-empty string.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.price || 0 >= opts.price) {
    throw new TypeError('Expecting whole number price.')
  }

  opts = Object.assign(opts, { estimate: true })
  return setPrice(opts)
}

/**
 * Sets the price of the given Ara identity
 * @param {Object}   opts
 * @param {String}   opts.did
 * @param {String}   opts.password
 * @param {Number}   opts.quantity
 * @param {Object}   [opts.keyringOpts]
 * @param {Number}   opts.price
 * @param {Boolean}  opts.estimate
 */
async function setPrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.did || !opts.did) {
    throw new TypeError('Expecting non-empty string.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.price || 0 >= opts.price) {
    throw new TypeError('Expecting whole number price.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean.')
  }

  const quantity = Number(opts.quantity) || 1

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Expecting quantity to be a whole number. Got ${quantity}. Try passing 'opts.quantity' as a whole number.`)
  }

  let {
    did, estimate, price
  } = opts
  const { password, keyringOpts } = opts

  estimate = estimate || false

  let ddo
  try {
    ({ did, ddo } = await validate({
      did, password, label: 'price', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(did))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)

  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  if ('string' !== typeof price) {
    price = price.toString()
  }

  let copyText
  if (1 !== quantity) {
    copyText = 'copies'
  } else {
    copyText = 'copy'
  }

  debug(`setting price for AFS ${did} to ${price} for ${quantity} ${copyText}...`)

  price = token.expandTokenValue(price)

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setPrice',
        values: [
          quantity,
          price
        ]
      }
    })

    if (estimate) {
      return tx.estimateCost(transaction)
    }

    return tx.sendSignedTransaction(transaction)
  } catch (err) {
    throw err
  }
}

/**
 * Gets the price of the given Ara identity
 * @param {Object}   opts
 * @param {String}   opts.did
 * @param {Number}   opts.quantity
 * @return {Number}
 */
async function getPrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.did || !opts.did) {
    throw new TypeError('Expecting non-empty string.')
  }

  const quantity = Number(opts.quantity) || 1

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error(`Expecting quantity to be a whole number. Got ${quantity}. Try passing 'opts.quantity' as a whole number.`)
  }

  const { did } = opts

  if (!(await proxyExists(did))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)

  let result = await call({
    abi,
    address: proxy,
    functionName: 'getPrice',
    arguments: [
      quantity
    ]
  })
  result = token.constrainTokenValue(result)
  debug('price for %d copies of %s: %d', quantity, did, result)

  return result
}

/**
 * Removes a price tier
 * @param {Object}   opts
 * @param {String}   opts.did
 * @param {String}   opts.password
 * @param {Number}   opts.quantity
 * @param {Object}   [opts.keyringOpts]
 * @param {Boolean}  opts.estimate
 */
async function removePriceTier(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.did || !opts.did) {
    throw new TypeError('Expecting non-empty string.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 >= opts.quantity) {
    throw new TypeError('Expecting quantity to be a whole number.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean.')
  }

  let { did, estimate } = opts
  const { password, keyringOpts, quantity } = opts

  estimate = estimate || false

  let ddo
  try {
    ({ did, ddo } = await validate({
      did, password, label: 'removePriceTier', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(did))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)

  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'removePriceTier',
        values: [
          quantity
        ]
      }
    })

    if (estimate) {
      return tx.estimateCost(transaction)
    }

    return tx.sendSignedTransaction(transaction)
  } catch (err) {
    throw err
  }
}

module.exports = {
  estimateSetPriceGasCost,
  removePriceTier,
  setPrice,
  getPrice
}
