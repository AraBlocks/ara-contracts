const debug = require('debug')('ara-contracts:commerce')
const { abi } = require('./build/contracts/AFS.json')
const hasDIDMethod = require('has-did-method')
const { isValidBytes32 } = require('./util')
const { resolve } = require('path')
const token = require('./token')
const price = require('./price')
const pify = require('pify')
const fs = require('fs')

const {
  MIN_RESALE_PRICE,
  MAX_NUM_RESALES,
  BYTES32_LENGTH,
  TOTAL_SUPPLY,
  PRICE_TIERS,
  AID_PREFIX,
  CONFIG_ID,
  UNLOCK,
  LIST
} = require('./constants')

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
    ethify,
    account,
    contract,
    isAddress,
  }
} = require('ara-util')

/**
 * As an owner, Sets the resale configuration for an AFS
 * @param  {Object}        opts
 * @param  {String}        opts.contentDid
 * @param  {String}        opts.password
 * @param  {Number}        opts.config // path to configuration JSON
 * @param  {Boolean}       opts.estimate
 * @param  {Object}        [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function setResaleConfig(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('string' !== typeof opts.config || !opts.config) {
    throw new TypeError('Expecting a non-empty path.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  let {
    contentDid,
    password,
    config,
    estimate,
    keyringOpts
  } = opts

  try {
    await pify(fs.access)(resolve(config))
  } catch (err) {
    throw new Error('Expecting a valid path')
  }

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'setResaleConfig', keyringOpts
    }))
  } catch (err) {
    throw err
  }
  debug(`setting resale config ${config}...`)

  try {
    const contents = fs.readFileSync(config)
    const resaleConfig = JSON.parse(contents)

    let id = resaleConfig[`${CONFIG_ID}`]
    let totalSupply = resaleConfig[`${TOTAL_SUPPLY}`]
    let priceTiers = resaleConfig[`${PRICE_TIERS}`]
    let minResalePrice = resaleConfig[`${MIN_RESALE_PRICE}`].toString()
    let maxNumResales = resaleConfig[`${MAX_NUM_RESALES}`]
    let list = resaleConfig[`${LIST}`]
    let unlock = resaleConfig[`${UNLOCK}`]

    if (id && 'number' !== typeof id || 0 >= id || !Number.isInteger(id)) {
      throw new TypeError('Expecting config-id to be a whole number.')
    }

    for (let tier in priceTiers) {
      let currPrice = Number(await price.getPrice({
        did: contentDid,
        quantity: tier
      }))
      if (currPrice !== priceTiers[tier]) {
        await price.setPrice({
          did: contentDid,
          password,
          quantity: tier,
          price: priceTiers[tier],
          keyringOpts
        })
      } else {
        debug(`AFS ${contentDid} already has price set to ${currPrice} for ${tier} copies`)
      }
    }

    let configOpts = { contentDid, password, keyringOpts }

    if (totalSupply) {
      let currSupply = await getSupply({ contentDid })
      if (Number(currSupply) !== Number(totalSupply)) {
        const args = Object.assign(configOpts, { quantity: totalSupply })
        await setSupply(args)
      } else {
        debug(`AFS ${contentDid} already has total supply of ${totalSupply}`)
      }
    }

    if (minResalePrice) {
      let currMinPrice = await getMinResalePrice({
        contentDid,
        configID: id
      })
      if (currMinPrice !== minResalePrice) {
        const args = Object.assign(configOpts, { price: minResalePrice, configID: id })
        await setMinResalePrice(args)
      } else {
        debug(`AFS ${contentDid} already has minimum resale price set to ${currMinPrice}`)
      }
    }

    if (maxNumResales) {
      let currMaxResales = await getResaleQuantity({
        contentDid,
        configID: id
      })
      if (currMaxResales !== maxNumResales) {
        const args = Object.assign(configOpts, { maxResales: maxNumResales, configID: id })
        await setResaleQuantity(args)
      } else {
        debug(`AFS ${contentDid} already has max number of resales set to ${maxNumResales}`)
      }
    }

    if (list) {
      if (!(await isListed(contentDid))) {
        await listAFS(configOpts)
      } else {
        debug(`AFS ${contentDid} is already listed for sale`)
      }
    }

    if (unlock) {
      if (!(await isResellable(contentDid))) {
        const args = Object.assign(configOpts, { configID: id })
        await unlockResale(args)
      } else {
        debug(`AFS ${contentDid} resale configuration ${id} is already unlocked`)
      }
    }

     debug(`Resale config ${config} successfully set.`)
  } catch (err) {
    throw err
  }
}

/**
 * As an owner, set the minimum resale price for an AFS
 * @param  {Object}        opts
 * @param  {String}        opts.contentDid
 * @param  {String}        opts.password
 * @param  {String|Number} opts.price
 * @param  {Number}        opts.configID
 * @param  {Boolean}       opts.estimate
 * @param  {Object}        [opts.keyringOpts]
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
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const { password, keyringOpts, estimate, configID } = opts
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
          configID,
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
 * @param  {Number} opts.configID
 * @throws {Error,TypeError}
 */
async function getMinResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const { contentDid, configID } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let price
  try {
    ({ minResalePrice: price } = await call({
      abi,
      address: proxy,
      functionName: 'globalConfigs_',
      arguments: [
        configID
      ]
    }))
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
 * @param  {String}        opts.configID
 * @param  {String|Number} opts.price
 * @param  {Boolean}       opts.estimate
 * @param  {Object}        [opts.keyringOpts]
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
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const { password, keyringOpts, estimate, configID } = opts
  let {
    requesterDid,
    contentDid,
    price
  } = opts

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
          configID,
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
 * @param  {String} opts.sellerDid
 * @param  {String} opts.configID
 * @throws {Error,TypeError}
 */
async function getResalePrice(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.sellerDid || !opts.sellerDid) {
    throw new TypeError('Expecting non-empty seller DID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const { contentDid, configID } = opts
  let { sellerDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  seller = await getAddressFromDID(normalize(sellerDid))

  let price
  try {
    const config = await getResaleConfig({
      sellerDid,
      contentDid,
      configID
    })
    price = config.resalePrice
  } catch (err) {
    throw err
  }
  return price
}

/**
 * Unlock a quantity of a purchased AFS for resale
 * @param  {Object}  opts
 * @param  {String}  opts.requesterDid
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {String}  opts.configID
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function unlockResaleQuantity(opts) {
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
 * @param  {String}  opts.configID
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function lockResaleQuantity(opts) {
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
 * @param  {String}  opts.configID
 * @param  {Boolean} opts.estimate
 * @param  {Boolean} [opts.unlock]
 * @param  {Object}  [opts.keyringOpts]
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
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    quantity,
    estimate,
    configID
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
        functionName: unlock ? 'unlockResaleQuantity' : 'lockResaleQuantity',
        values: [
          configID,
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
 * @param  {String} opts.sellerDid
 * @param  {String} opts.configID
 * @throws {Error,TypeError}
 */
async function getResaleAvailability(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.sellerDid || !opts.sellerDid) {
    throw new TypeError('Expecting non-empty seller DID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const { contentDid, configID } = opts
  let { sellerDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  seller = await getAddressFromDID(normalize(sellerDid))

  let quantity
  try {
    const config = await getResaleConfig({
      sellerDid,
      contentDid,
      configID
    })
    quantity = config.available
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
 * @param  {Number}  opts.configID
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
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
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    maxResales,
    configID
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
          configID,
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
 * @param  {Number} opts.configID
 * @throws {Error,TypeError}
 */
async function getResaleQuantity(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const { contentDid, configID } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let quantity
  try {
    ({ maxNumResales: quantity } = await call({
      abi,
      address: proxy,
      functionName: 'globalConfigs_',
      arguments: [
        configID
      ]
    }))
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
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function setSupply(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if ('number' !== typeof opts.quantity || 0 >= opts.quantity || !Number.isInteger(opts.quantity)) {
    throw new TypeError('Expecting positive number supply.')
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
 * @param  {Object}  [opts.keyringOpts]
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
        functionName: 'increaseSupply',
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
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.quantity
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
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
        functionName: 'decreaseSupply',
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
 * @param  {Object}  [opts.keyringOpts]
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
        functionName: 'setUnlimitedSupply'
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
 * Gets the current supply of an AFS, -1 if unlimited
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
    if (0 === Number(quantity) && 
      await call({
        abi,
        address: proxy,
        functionName: 'unlimited_'
      })) {
        quantity = -1
    }
  } catch (err) {
    throw err
  }
  return quantity
}

/**
 * Checks if an AFS is currently listed for sale
 * @param {String} contentDid
 */
async function isListed(contentDid) {
  if ('string' !== typeof contentDid || !contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  return call({
    abi,
    address: proxy,
    functionName: 'listed_'
  })
}

/**
 * List an AFS for sale
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function listAFS(opts) {
  opts = Object.assign(opts, { list: true })
  return _toggleList(opts)
}

/**
 * Unlist an AFS for sale
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function unlistAFS(opts) {
  opts = Object.assign(opts, { list: false })
  return _toggleList(opts)
}

/**
 * Toggle an AFS's listing status
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @param  {Boolean} opts.list
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function _toggleList(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    list
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'toggleList', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  if (list) {
    debug(`listing ${contentDid}...`)
  } else {
    debug(`unlisting ${contentDid}...`)
  }

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
        functionName: list ? 'list' : 'unlist'
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

async function isResellable(contentDid) {
  if ('string' !== typeof contentDid || !contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  return call({
    abi,
    address: proxy,
    functionName: 'resellable_'
  })
}

/**
 * Mark an AFS available for resale
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Number}  opts.configID
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function unlockResale(opts) {
  opts = Object.assign(opts, { resale: true })
  return _toggleResale(opts)
}

/**
 * Mark an AFS unavailable for resale
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function lockResale(opts) {
  opts = Object.assign(opts, { resale: false })
  return _toggleResale(opts)
}

/**
 * Toggle an AFS's listing status
 * @param  {Object}  opts
 * @param  {String}  opts.contentDid
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @param  {Boolean} opts.list
 * @param  {Object}  [opts.keyringOpts]
 * @throws {Error,TypeError}
 */
async function _toggleResale(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if ('string' !== typeof opts.password || !opts.password) {
    throw TypeError('Expecting non-empty password.')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting opts.estimate to be a boolean.')
  } else if (opts.resale && (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID))) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const {
    password,
    keyringOpts,
    estimate,
    resale,
    configID
  } = opts
  let { contentDid } = opts

  let ddo
  try {
    ({ did: contentDid, ddo } = await validate({
      did: contentDid, password, label: 'toggleResale', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  if (resale) {
    debug(`Unlocking AFS ${contentDid} for resale with resale configuration ${configID}...`)
  } else {
    debug(`Locking AFS ${contentDid} from resale...`)
  }

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
        functionName: resale ? 'unlockResale' : 'lockResale',
        values: resale ? [ configID ] : []
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
 * Requests ownership of an AFS.
 * @param  {Object} opts
 * @param  {String} opts.sellerDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.configID
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function getResaleConfig(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object.')
  } else if (opts.sellerDid && 'string' !== typeof opts.sellerDid) {
    throw new TypeError('Expecting non-empty seller DID.')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID.')
  } else if (('number' !== typeof opts.configID && !Number(opts.configID)) || 0 >= Number(opts.configID)) {
    throw new TypeError('Expecting whole number for configID.')
  }

  const { configID } = opts
  let { contentDid, sellerDid } = opts

  if (!(await proxyExists(contentDid))) {
    throw new Error('This content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  let seller 
  if (sellerDid) {
    seller = await getAddressFromDID(normalize(sellerDid))
  }

  let config = {}
  try {
    let resaleConfig
    if (seller) {
      resaleConfig = await call({
        abi,
        address: proxy,
        functionName: 'getResaleConfig',
        arguments: [
          sha3({ t: 'address', v: seller }),
          configID
        ]
      })
      config = {
        minResalePrice: token.constrainTokenValue(resaleConfig.minResalePrice),
        maxNumResales: resaleConfig.maxNumResales,
        resalePrice: token.constrainTokenValue(resaleConfig.resalePrice),
        available: resaleConfig.available,
        quantity: resaleConfig.quantity
      }
    } else {
      resaleConfig = await call({
        abi,
        address: proxy,
        functionName: 'globalConfigs_',
        arguments: [
          configID
        ]
      })
      config = {
        minResalePrice: token.constrainTokenValue(resaleConfig.minResalePrice),
        maxNumResales: resaleConfig.maxNumResales
      }
    }
  } catch (err) {
    throw err
  }
  return config
}

/**
 * Requests ownership of an AFS.
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {String} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function requestOwnership(opts) {
  return _updateOwnershipRequest(opts, 'requestOwnership')
}

/**
 * Revokes a previous ownership request of an AFS.
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @param  {String} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function revokeOwnershipRequest(opts) {
  return _updateOwnershipRequest(opts, 'revokeOwnershipRequest')
}

/**
 * Approves an ownership transfer request.
 * This officially transfers ownership for the given AFS.
 * @param  {Object}  opts
 * @param  {String}  opts.did
 * @param  {String}  opts.password
 * @param  {Boolean} opts.estimate
 * @throws {Error|TypeError}
 * @return {Object}
 */
async function approveOwnershipTransfer(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.newOwnerDid || 'string' !== typeof opts.newOwnerDid) {
    throw new TypeError('Expecting non-empty new owner DID')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  }

  const {
    did,
    password,
    newOwnerDid,
    keyringOpts
  } = opts

  let ownerAddress
  let newOwnerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did,
      password,
      label: 'approveOwnershipTransfer',
      keyringOpts
    }))
    ownerAddress = await getAddressFromDID(normalize(did))
    newOwnerAddress = await getAddressFromDID(normalize(newOwnerDid))
  } catch (err) {
    throw err
  }

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  if (!isAddress(newOwnerAddress)) {
    throw new Error(`opts.newOwnerDid did not resolve to a valid Ethereum address.
      Ensure ${newOwnerDid} is a valid Ara identity.`)
  }

  if (!(await proxyExists(did))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  const acct = await account.load({ did: owner, password })
  const approveTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName: 'approveOwnershipTransfer',
      values: [ newOwnerAddress ]
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(approveTx)
  }

  return tx.sendSignedTransaction(approveTx)
}

async function getOwnerProfit(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  }

  const {
    did,
    password,
    keyringOpts = {}
  } = opts

  let ownerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did,
      password,
      label: 'getOwnerProfit',
      keyringOpts
    }))
    ownerAddress = await getAddressFromDID(normalize(did))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(did))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  let profit = await call({
    abi,
    address: proxy,
    functionName: 'getOwnerProfit'
  })

  return parseInt(profit) / 100
}

async function getRoyalty(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.recipients || !Array.isArray(opts.recipients) || 0 === opts.recipients.length) {
    throw new TypeError('Expecting valid array for recipients')
  }

  const {
    did,
    password,
    recipients,
    keyringOpts = {}
  } = opts

  let ownerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did,
      password,
      label: 'getRoyalty',
      keyringOpts
    }))
    ownerAddress = await getAddressFromDID(normalize(did))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(did))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  const result = []
  for (let i in recipients) {
    const recipient = recipients[i]
    if (!recipient || 'string' !== typeof recipient) {
      throw new TypeError('Expecting recipient DID to be non-empty')
    }

    let address = await getAddressFromDID(normalize(recipient))
    if (!isAddress(address)) {
      throw new Error(`recipient.did did not resolve to a valid Ethereum address. 
        Ensure ${recipient} is a valid Ara identity.`)
    }

    address = sha3(address)
    const royalty = await call({
      abi,
      address: proxy,
      functionName: 'getRoyalty',
      arguments: [ address ]
    })
    result.push({
      did: recipient,
      amount: parseInt(royalty) / 100
    })
  }

  return result
}

async function setRoyalties(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Expecting non-empty DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.recipients || !Array.isArray(opts.recipients) || 0 === opts.recipients.length) {
    throw new TypeError('Expecting valid array for royalty recipients')
  }

  const {
    did,
    password,
    recipients,
    keyringOpts = {}
  } = opts

  let ownerAddress
  let ddo
  try {
    ({ ddo } = await validate({
      did,
      password,
      label: 'setRoyalties',
      keyringOpts
    }))
    ownerAddress = await getAddressFromDID(normalize(did))
  } catch (err) {
    throw err
  }

  if (!(await proxyExists(did))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(did)
  let owner = getDocumentOwner(ddo, true)
  owner = `${AID_PREFIX}${owner}`

  if (!isAddress(ownerAddress)) {
    throw new Error(`opts.did did not resolve to a valid Ethereum address. 
      Ensure ${did} is a valid Ara identity.`)
  }

  let total = 0
  let addresses = []
  let amounts = []
  // check valid receipients
  for (let i in recipients) {
    const recipient = recipients[i]
    if (!recipient.did || 'string' !== typeof recipient.did) {
      throw new TypeError('Expecting recipient.did to be a non-empty DID')
    } else if (!recipient.amount || 'number' !== typeof recipient.amount || 0 > recipient.amount) {
      throw new TypeError('Expecting amount to be positive Number')
    }

    const { did } = recipient
    let { amount } = recipient
    let address = await getAddressFromDID(normalize(did))
    if (!isAddress(address)) {
      throw new Error(`recipient.did did not resolve to a valid Ethereum address. 
        Ensure ${did} is a valid Ara identity.`)
    }

    if (addresses.includes(address)) {
      throw new Error('Duplicate DIDs found in recipients.')
    }

    address = sha3(address)
    console.log('shad address', address)
    addresses.push(address)

    const precision = _getAmountPrecision(amount)
    if (2 < precision) {
      throw new Error('Royalty amount precision cannot exceed hundredths')
    }

    amount = parseInt((amount * 100).toFixed(2))

    total += amount
    if (10000 < total) {
      throw new Error('Royalty totals cannot exceed 100% of the AFS price.')
    }

    amounts.push(amount)
  }

  const acct = await account.load({ did: owner, password })
  const royaltiesTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 2000000,
    data: {
      abi,
      functionName: 'setRoyalties',
      values: [ addresses, amounts ]
    }
  })

  const receipt = await tx.sendSignedTransaction(royaltiesTx)
  if (receipt.status) {
    debug('royalty update receipt', receipt)
  }

  return receipt
}

async function _updateOwnershipRequest(opts, functionName = '') {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (!opts.requesterDid || 'string' !== typeof opts.requesterDid) {
    throw new TypeError('Expecting non-empty requester DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  }

  const {
    keyringOpts,
    contentDid,
    password
  } = opts
  let { requesterDid } = opts

  let requesterAddress
  try {
    await validate({
      label: functionName,
      did: requesterDid,
      keyringOpts,
      password
    })
    requesterAddress = await getAddressFromDID(normalize(requesterDid))
  } catch (err) {
    throw err
  }

  if (!isAddress(requesterAddress)) {
    throw new Error(`opts.requesterDid did not resolve to a valid Ethereum address. 
      Ensure ${requesterDid} is a valid Ara identity.`)
  }

  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  const proxy = await getProxyAddress(contentDid)

  if (!hasDIDMethod(requesterDid)) {
    requesterDid = `${AID_PREFIX}${requesterDid}`
  }

  const acct = await account.load({ did: requesterDid, password })
  const requestTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName
    }
  })

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(requestTx)
  }

  return tx.sendSignedTransaction(requestTx)
}

function _getAmountPrecision(amount) {
  // trims trailing insignificant zeroes
  amount = amount.toString()
  return amount.includes('.')
    ? amount.split('.')[1].length
    : 0
}

module.exports = {
  approveOwnershipTransfer,
  revokeOwnershipRequest,
  getResaleAvailability,
  unlockResaleQuantity,
  lockResaleQuantity,
  setUnlimitedSupply,
  setMinResalePrice,
  getMinResalePrice,
  setResaleQuantity,
  getResaleQuantity,
  getResaleQuantity,
  requestOwnership,
  setResaleConfig,
  getResaleConfig,
  setResalePrice,
  getResalePrice,
  decreaseSupply,
  increaseSupply,
  getOwnerProfit,
  setRoyalties,
  unlockResale,
  isResellable,
  lockResale,
  getRoyalty,
  setSupply,
  getSupply,
  unlistAFS,
  isListed,
  listAFS
}
