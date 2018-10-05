const debug = require('debug')('ara-contracts:commerce')
const { abi } = require('./build/contracts/AFS.json')
const { AID_PREFIX } = require('./constants')
const token = require('./token')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  validate,
  normalize,
  getDocumentOwner,
  getAddressFromDID,
  web3: {
    tx,
    call,
    sha3,
    account
  }
} = require('ara-util')

/**
 * As an owner, set the minimum resale price for an AFS
 * @param  {Object}        opts
 * @param  {String}        opts.contentDid
 * @param  {String}        opts.password
 * @param  {String|Number} opts.price
 * @param {Boolean}        opts.estimate
 * @throws {Error,TypeError}
 */
async function setMinResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (('number' !== typeof opts.price && !Number(opts.price)) || 0 >= Number(opts.price)) {
    throw new TypeError('Expecting whole number price.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const { password, keyringOpts, estimate } = opts
  let { contentDid, price } = opts
  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setMinResalePrice', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`setting minimum resale price for ${contentDid} to ${price}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  if ('string' !== typeof price) {
    price = price.toString()
  }

  price = token.expandTokenValue(price)

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setMinResalePrice',
        values: [
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
 * Get the minimum resale price for an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @throws {Error,TypeError}
 */
async function getMinResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  }

  const { contentDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let price
  try {
    price = await call({
      abi,
      address: proxy,
      functionName: 'minResalePrice_'
    })
  } catch (err) {
    throw err
  }
  return token.constrainTokenValue(price)
}

/**
 * As a reseller, set the resale price for an AFS
 * @param  {Object}        opts
 * @param  {String}        opts.requesterDid
 * @param  {String}        opts.contentDid
 * @param  {String}        opts.password
 * @param  {String|Number} opts.price
 * @param  {Boolean}       opts.estimate
 * @throws {Error,TypeError}
 */
async function setResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (('number' !== typeof opts.price && !Number(opts.price)) || 0 >= Number(opts.price)) {
    throw new TypeError('Expecting whole number price.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const { password, keyringOpts, estimate } = opts
  let { requesterDid, contentDid, price } = opts
  try {
    ({ did: requesterDid } = await validate({
      did: requesterDid, password, label: 'setResalePrice', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(`setting resale price for ${contentDid} to ${price}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  requesterDid = `${AID_PREFIX}${requesterDid}`
  const acct = await account.load({ did: requesterDid, password })

  if ('string' !== typeof price) {
    price = price.toString()
  }

  price = token.expandTokenValue(price)

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setResalePrice',
        values: [
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
 * Get the resale price for an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.seller
 * @throws {Error,TypeError}
 */
async function getResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.seller || !opts.seller) {
    throw new TypeError('Expecting non-empty seller DID.')
  }

  const { contentDid } = opts
  let { seller } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  seller = await getAddressFromDID(seller)

  let price
  try {
    price = await call({
      abi,
      address: proxy,
      functionName: 'purchasers_',
      arguments: [
        sha3({ t: 'address', v: seller })
      ]
    })[2]
  } catch (err) {
    throw err
  }
  return token.constrainTokenValue(price)
}

/**
 * Unlock a quantity of a purchased AFS for resale
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function unlockResale(opts) {
  opts = Object.assign(opts, { unlock: true })
  return _setResaleAvailability(opts)
}

/**
 * Lock a quantity of a purchased AFS for resale
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function lockResale(opts) {
  opts = Object.assign(opts, { unlock: false })
  return _setResaleAvailability(opts)
}

/**
 * Modify the resale availability of a purchased AFS
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @param  {Boolean} [opts.unlock]
 * @throws {Error,TypeError}
 */
async function _setResaleAvailability(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 >= opts.quantity) {
    throw new TypeError('Expecting positive number of resales.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    quantity,
    estimate
  } = opts
  let { requesterDid, contentDid } = opts
  const unlock = opts.unlock || false

  try {
    ({ did: requesterDid } = await validate({
      did: requesterDid, password, label: '_setResaleAvailability', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  if (unlock) {
    debug(`Unlocking ${contentDid} for resale for seller ${requesterDid}`)
  } else {
    debug(`Locking ${contentDid} for resale for seller ${requesterDid}`)
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  requesterDid = `${AID_PREFIX}${requesterDid}`
  const acct = await account.load({ did: requesterDid, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: unlock ? 'unlockResale' : 'lockResale',
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

/**
 * Get the number of purchased AFSs available for resale
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.seller
 * @throws {Error,TypeError}
 */
async function getResaleAvailability(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.seller || !opts.seller) {
    throw new TypeError('Expecting non-empty seller DID.')
  }

  const { contentDid } = opts
  let { seller } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  seller = await getAddressFromDID(seller)

  let quantity
  try {
    quantity = await call({
      abi,
      address: proxy,
      functionName: 'purchasers_',
      arguments: [
        sha3({ t: 'address', v: seller })
      ]
    })[0]
  } catch (err) {
    throw err
  }
  return quantity
}

/**
 * Set the maximum number of resales for an AFS
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.maxResales
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function setResaleQuantity(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.maxResales || 0 >= opts.maxResales) {
    throw new TypeError('Expecting positive number of resales.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    maxResales
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setResaleQuantity', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`setting maximum number of resales for ${contentDid} to ${maxResales}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setResaleQuantity',
        values: [
          maxResales
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
 * Get the number of times an AFS can be resold
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @throws {Error,TypeError}
 */
async function getResaleQuantity(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  }

  const { contentDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let quantity
  try {
    quantity = await call({
      abi,
      address: proxy,
      functionName: 'maxNumResales_'
    })
  } catch (err) {
    throw err
  }
  return quantity
}

/**
 * Sets the supply of an AFS
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function setSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 >= opts.quantity) {
    throw new TypeError('Expecting positive number to increase by.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    quantity
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setSupply', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`setting supply for ${contentDid} to ${quantity}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setSupply',
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

/**
 * Increase the supply of an AFS
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function increaseSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 >= opts.quantity) {
    throw new TypeError('Expecting positive number to increase by.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    quantity
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'increaseSupply', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`adding ${quantity} copies for ${contentDid}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'addCopies',
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

/**
 * Decrease the supply of an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Number} opts.quantity
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function decreaseSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 > opts.quantity) {
    throw new TypeError('Expecting positive number to decrease by.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    quantity
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'decreaseSupply', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`adding ${quantity} copies for ${contentDid}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'removeCopies',
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

/**
 * Remove scarcity limitations from an AFS
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @throws {Error,TypeError}
 */
async function setUnlimitedSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const { password, keyringOpts, estimate } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setUnlimitedSupply', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`removing scarcity limitations for ${contentDid}`)

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let owner = getDocumentOwner(ddo)
  owner = `${AID_PREFIX}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'removeScarcity'
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
 * Gets the current supply of an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @throws {Error,TypeError}
 */
async function getSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  }

  const { contentDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let quantity
  try {
    quantity = await call({
      abi,
      address: proxy,
      functionName: 'totalCopies_'
    })
  } catch (err) {
    throw err
  }
  return quantity
}

module.exports = {
  getResaleAvailability,
  setUnlimitedSupply,
  setMinResalePrice,
  getMinResalePrice,
  setResaleQuantity,
  getResaleQuantity,
  setResalePrice,
  getResalePrice,
  decreaseSupply,
  increaseSupply,
  unlockResale,
  lockResale,
  setSupply,
  getSupply
}
