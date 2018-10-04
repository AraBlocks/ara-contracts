const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:commerce')
const token = require('./token')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  hashDID,
  validate,
  normalize,
  getDocumentOwner,
  getAddressFromDID,
  web3: {
    tx,
    call,
    sha3,
    ethify,
    account,
    contract
  },
  errors: {
    MissingOptionError
  }
} = require('ara-util')

/**
 * Set the minimum resale price for an AFS
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

  const { password, keyringOpts } = opts
  let { contentDid, price } = opts
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
  owner = `${kAidPrefix}${owner}`
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
 * Set the resale price for an AFS
 * @param  {Object}        opts
 * @param  {String}        opts.requesterDid
 * @param  {String}        opts.contentDid
 * @param  {String}        opts.password
 * @param  {String|Number} opts.price
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
  }

  const { password, keyringOpts } = opts
  let { requesterDid, contentDid, price } = opts
  try {
    ({ did: requesterDid, ddo } = await validate({
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
 * Set the maximum number of resales for an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Number} opts.maxResales
 * @throws {Error,TypeError}
 */
async function setMaxNumResales(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.maxResales || 0 >= opts.maxResales) {
    throw new TypeError('Expecting positive number of resales.')
  }

  const { password, keyringOpts } = opts
  let { contentDid, maxResales } = opts
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setMaxNumResales', keyringOpts
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
  owner = `${kAidPrefix}${owner}`
  const acct = await account.load({ did: owner, password })

  try {
    const transaction = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi,
        functionName: 'setMaxNumResales',
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
 * Increase the total number of copies of an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Number} opts.quantity
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
  }

  const { password, keyringOpts } = opts
  let { contentDid, quantity } = opts
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'addCopies', keyringOpts
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
  owner = `${kAidPrefix}${owner}`
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
 * Decrease the total number of copies of an AFS
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {Number} opts.quantity
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
  }

  const { password, keyringOpts } = opts
  let { contentDid, quantity } = opts
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'addCopies', keyringOpts
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
  owner = `${kAidPrefix}${owner}`
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
 * @param  {Object} opts
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @throws {Error,TypeError}
 */
async function setUnlimitedSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  }

  const { password, keyringOpts } = opts
  let { contentDid } = opts
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'addCopies', keyringOpts
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
  owner = `${kAidPrefix}${owner}`
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

module.exports = {
  setUnlimitedSupply,
  setMinResalePrice,
  setResaleQuantity,
  setResalePrice,
  decreaseSupply,
  increaseSupply
}
