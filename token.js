const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const debug = require('debug')('ara-contracts:token')
const BigNumber = require('bignumber.js')
const { web3 } = require('ara-context')()

const {
  validate,
  normalize,
  getAddressFromDID
} = require('ara-util')

const {
  AID_PREFIX,
  ARA_TOKEN_ADDRESS,
  TOKEN_DECIMALS
} = require('./constants')

const {
  isAddress,
  account,
  call,
  tx
} = require('ara-util/web3')

/**
 * Get the Ara balance of a specific Ara DID.
 * @param  {String} did
 * @return {Number}
 * @throws {Error|TypeError}
 */
async function balanceOf(did) {
  let address
  try {
    did = normalize(did)
    address = await getAddressFromDID(did)
  } catch (err) {
    throw err
  }

  if (!isAddress(address)) {
    throw new Error(`${did} did not resolve to a valid Ethereum address. Got ${address}. Ensure ${did} is a valid Ara identity.`)
  }

  let balance
  try {
    balance = await call({
      abi: tokenAbi,
      address: ARA_TOKEN_ADDRESS,
      functionName: 'balanceOf',
      arguments: [ address ]
    })
  } catch (err) {
    throw err
  }

  return constrainTokenValue(balance)
}

/**
 * Gets the total circulating supply of Ara.
 * @return {String}
 * @throws {Error}
 */
async function totalSupply() {
  let supply
  try {
    supply = await call({
      abi: tokenAbi,
      address: ARA_TOKEN_ADDRESS,
      functionName: 'totalSupply'
    })
  } catch (err) {
    throw err
  }
  return constrainTokenValue(supply)
}

/**
 * Get the amount of Ara that an owner has allowed for a spender to spend.
 * @param  {Object} opts
 * @param  {String} opts.owner
 * @param  {String} opts.spender
 * @return {Number}
 * @throws {TypeError|Error}
 */
async function allowance(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(`Expected 'opts' to be an object. Got ${opts}. Try passing in 'opts.owner' and 'opts.spender'.`)
  }

  let { owner, spender } = opts
  try {
    if (!isAddress(owner)) {
      owner = normalize(owner)
      owner = await getAddressFromDID(owner)
    }
    if (!isAddress(spender)) {
      spender = normalize(spender)
      spender = await getAddressFromDID(spender)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(owner)) {
    throw new Error(`'opts.owner' did not resolve to a valid Ethereum address. Got ${owner}. Ensure ${opts.owner} is a valid Ara identity.`)
  }
  if (!isAddress(spender)) {
    throw new Error(`'opts.spender' did not resolve to a valid Ethereum address. Got ${spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  }

  let allowed
  try {
    allowed = await call({
      abi: tokenAbi,
      address: ARA_TOKEN_ADDRESS,
      functionName: 'allowance',
      arguments: [ owner, spender ]
    })
  } catch (err) {
    throw err
  }
  return constrainTokenValue(allowed)
}

/**
 * Transfers Ara from the sender account to a specified address.
 * @param  {Object} opts
 * @param  {String} opts.to
 * @param  {Number} opts.val
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function transfer(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(`Expected 'opts' to be an object. Got ${opts}. Try passing in 'opts.to', 'opts.val', 'opts.did', and 'opts.password'.`)
  } else if (!opts.to || 'string' !== typeof opts.to) {
    throw new TypeError(`Expected 'opts.to' to be non-empty Ara DID string. Got ${opts.to}. Ensure ${opts.to} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${password}.`)
  }

  let { did, val, to } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    if (!isAddress(to)) {
      to = normalize(to)
      to = await getAddressFromDID(to)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(to)) {
    throw new Error(`'opts.to' did not resolve to a valid Ethereum address. Got ${to}. Ensure ${opts.to} is a valid Ara identity.`)
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)
  let receipt
  try {
    const transferTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'transfer',
        values: [ to, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(transferTx)
  } catch (err) {
    throw err
  }
  return receipt
}

/**
 * Approve an address to spend a specified amount on the sender's behalf.
 * @param  {Object} opts
 * @param  {String} opts.spender
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Number} opts.val
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function approve(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender, val } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    if (!isAddress(spender)) {
      spender = normalize(spender)
      spender = await getAddressFromDID(spender)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(spender)) {
    throw new Error(`'opts.spender' did not resolve to a valid Ethereum address. Got ${spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const approveTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'approve',
        values: [ spender, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(approveTx)
  } catch (err) {
    throw err
  }
  return receipt
}

/**
 * Transfer Ara from one address to another.
 * @param  {Object} opts
 * @param  {String} opts.from
 * @param  {String} opts.to
 * @param  {Number} opts.val
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function transferFrom(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(`Expected 'opts' to be an object. Got ${opts}. Try passing in 'opts.from', 'opts.to', 'opts.val', 'opts.did', and 'opts.password'.`)
  } else if (!opts.to || 'string' !== typeof opts.to) {
    throw new TypeError(`Expected 'opts.to' to be non-empty Ara DID string. Got ${opts.to}. Ensure ${opts.to} is a valid Ara identity.`)
  } else if (!opts.from || 'string' !== typeof opts.from) {
    throw new TypeError(`Expected 'opts.from' to be non-empty Ara DID string. Got ${opts.from}. Ensure ${opts.from} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${password}.`)
  }

  let {
    did,
    val,
    from,
    to
  } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transferFrom' }))
    if (!isAddress(to)) {
      to = normalize(to)
      to = await getAddressFromDID(to)
    }
    if (!isAddress(from)) {
      from = normalize(from)
      from = await getAddressFromDID(from)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(from)) {
    throw new Error(`'opts.from' did not resolve to a valid Ethereum address. Got ${from}. Ensure ${opts.from} is a valid Ara identity.`)
  }
  if (!isAddress(to)) {
    throw new Error(`'opts.to' did not resolve to a valid Ethereum address. Got ${to}. Ensure ${opts.to} is a valid Ara identity.`)
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const transferFromTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'transferFrom',
        values: [ from, to, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(transferFromTx)
  } catch (err) {
    throw err
  }
  return receipt
}

/**
 * Increases the amount of Ara that an owner allowed to a spender.
 * @param  {Object} opts
 * @param  {String} opts.spender
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Number} opts.val
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function increaseApproval(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender, val } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    if (!isAddress(spender)) {
      spender = normalize(spender)
      spender = await getAddressFromDID(spender)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(spender)) {
    throw new Error(`'opts.spender' did not resolve to a valid Ethereum address. Got ${spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const increaseApprovalTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'increaseApproval',
        values: [ spender, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(increaseApprovalTx)
  } catch (err) {
    throw err
  }
  return receipt
}

/**
 * Decreased the amount of Ara that an owner allowed to a spender.
 * @param  {Object} opts
 * @param  {String} opts.spender
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Number} opts.val
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function decreaseApproval(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    if (!isAddress(spender)) {
      spender = normalize(spender)
      spender = await getAddressFromDID(spender)
    }
  } catch (err) {
    throw err
  }

  if (!isAddress(spender)) {
    throw new Error(`'opts.spender' did not resolve to a valid Ethereum address. Got ${spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const decreaseApprovalTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'decreaseApproval',
        values: [ spender, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(decreaseApprovalTx)
  } catch (err) {
    throw err
  }
  return receipt
}

/**
 * Expands token amount in Ara to be able to be read by the EVM
 * @param  {String} val
 * @return {String}
 * @throws {TypeError}
 */
function expandTokenValue(val) {
  if ('string' !== typeof val) {
    throw new TypeError(`Expected 'val' to be of type string. Got ${val}. Ensure ${val} is the string representation of a positive number.`)
  }
  if (!val) {
    return '0'
  }
  const input = `${val}e${TOKEN_DECIMALS}`
  return web3.utils.toBN(BigNumber(input)).toString()
}

/**
 * Constrains token amount from EVM to "real" Ara amount
 * @param  {String} val
 * @return {String}
 * @throws {TypeError}
 */
function constrainTokenValue(val) {
  if ('string' !== typeof val) {
    throw new TypeError(`Expected 'val' to be of type string. Got ${val}. Ensure ${val} is the string representation of a positive number.`)
  }
  if (!val) {
    return '0'
  }

  const input = `${val}e-${TOKEN_DECIMALS}`
  return BigNumber(input).toString()
}

/**
 * Modify Ara deposit for earning rewards
 * @param  {Object}   opts
 * @param  {String}   opts.did
 * @param  {String}   opts.password
 * @param  {Number}   opts.val
 * @param  {?Boolean} opts.withdraw
 * @return {Object}
 * @throws {TypeError}
 */
async function modifyDeposit(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(`Expected 'opts' to be an object. Got ${opts}. Try passing in 'opts.did', 'opts.password', and 'opts.val'.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${password}.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (opts.withdraw && 'boolean' !== typeof opts.withdraw) {
    throw new TypeError(`Expected 'opts.withdraw' to be a boolean. Got ${opts.withdraw}.`)
  }

  let { did, val, withdraw: wd } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: withdraw ? 'withdraw' : 'deposit' }))
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)
  wd = wd || false

  let receipt
  try {
    const depositTx = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: wd ? 'withdraw' : 'deposit',
        values: [ val ]
      }
    })
    receipt = await tx.sendSignedTransaction(depositTx)
    if (receipt.status) {
      debug(withdraw ? 'withdrew' : 'deposited', constrainTokenValue(val), 'tokens')
    }
    return receipt
  } catch (err) {
    throw err
  }
}

/**
 * Returns current deposit amount
 * @param  {String} did
 * @return {Number}
 * @throws {TypeError|Error}
 */
async function getAmountDeposited(did) {
  let address
  try {
    did = normalize(did)
    address = await getAddressFromDID(did)
  } catch (err) {
    throw err
  }

  if (!isAddress(address)) {
    throw new Error(`'did' did not resolve to a valid Ethereum address. Got ${address}. Ensure ${did} is a valid Ara identity.`)
  }

  let deposited
  try {
    deposited = await call({
      abi: tokenAbi,
      address: ARA_TOKEN_ADDRESS,
      functionName: 'amountDeposited',
      arguments: [ address ]
    })
  } catch (err) {
    throw err
  }

  return constrainTokenValue(deposited)
}

function _validateApprovalOpts(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError(`Expected 'opts' to be an object. Got ${opts}. Try passing in 'opts.spender', 'opts.val', 'opts.did', and 'opts.password'.`)
  } else if (!opts.spender || 'string' !== typeof opts.spender) {
    throw new TypeError(`Expected 'opts.spender' to be non-empty Ara DID string. Got ${opts.spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${opts.password}.`)
  }
}

module.exports = {
  constrainTokenValue,
  getAmountDeposited,
  expandTokenValue,
  increaseApproval,
  decreaseApproval,
  modifyDeposit,
  transferFrom,
  totalSupply,
  balanceOf,
  allowance,
  transfer,
  approve
}
