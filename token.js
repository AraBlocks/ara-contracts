const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const debug = require('debug')('ara-contracts:token')
const BigNumber = require('bignumber.js')
const createContext = require('ara-context')

const {
  validate,
  getIdentifier,
  getAddressFromDID,
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
 * Get the Ara balance of a specific Ara DID or Ethereum address.
 * @param  {String} account
 * @param  {Object} [keyringOpts]
 * @return {Number}
 * @throws {Error|TypeError}
 */
async function balanceOf(acct, keyringOpts) {
  try {
    acct = await _normalizeIDInput(acct, keyringOpts)
  } catch (err) {
    throw err
  }

  let balance
  try {
    balance = await call({
      abi: tokenAbi,
      address: ARA_TOKEN_ADDRESS,
      functionName: 'balanceOf',
      arguments: [ acct ]
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
  if (!opts.owner || 'string' !== typeof opts.owner) {
    throw new TypeError(`Expected opts.owner to be a valid string. Got ${opts.owner}. Ensure opts.owner is a valid Ara ID or Ethereum Address`)
  } else if (!opts.spender || 'string' !== typeof opts.owner) {
    throw new TypeError(`Expected opts.spender to be a valid string. Got ${opts.spender}. Ensure opts.spender is a valid Ara ID or Ethereum Address`)
  }

  let { owner, spender } = opts
  try {
    owner = await _normalizeIDInput(owner)
    spender = await _normalizeIDInput(spender)
  } catch (err) {
    throw err
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
 * @param  {String} opts.val
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function transfer(opts = {}) {
  if (!opts.to || 'string' !== typeof opts.to) {
    throw new TypeError(`Expected 'opts.to' to be non-empty Ara DID or Ethereum address string. Got ${opts.to}. Ensure ${opts.to} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${opts.password}.`)
  }

  let { did, val, to } = opts
  const { password, keyringOpts } = opts

  try {
    ({ did } = await validate({
      did, password, label: 'transfer', keyringOpts
    }))
    to = await _normalizeIDInput(to)
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)
  let receipt
  try {
    const { tx: transferTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'transfer',
        values: [ to, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(transferTx)
    ctx.close()
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
 * @param  {Object} [opts.keyringOpts]
 * @param  {Number} opts.val
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function approve(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender, val } = opts
  const { password, keyringOpts } = opts

  try {
    ({ did } = await validate({
      did, password, label: 'transfer', keyringOpts
    }))
    spender = await _normalizeIDInput(spender)
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const { tx: approveTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'approve',
        values: [ spender, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(approveTx)
    ctx.close()
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
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function transferFrom(opts = {}) {
  if (!opts.to || 'string' !== typeof opts.to) {
    throw new TypeError(`Expected 'opts.to' to be non-empty Ara DID string. Got ${opts.to}. Ensure ${opts.to} is a valid Ara identity.`)
  } else if (!opts.from || 'string' !== typeof opts.from) {
    throw new TypeError(`Expected 'opts.from' to be non-empty Ara DID string. Got ${opts.from}. Ensure ${opts.from} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${opts.password}.`)
  }

  let {
    did,
    val,
    from,
    to
  } = opts
  const { password, keyringOpts } = opts

  try {
    ({ did } = await validate({
      did, password, label: 'transferFrom', keyringOpts
    }))
    to = await _normalizeIDInput(to)
    from = await _normalizeIDInput(from)
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const { tx: transferFromTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'transferFrom',
        values: [ from, to, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(transferFromTx)
    ctx.close()
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
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function increaseApproval(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender, val } = opts
  const { password, keyringOpts } = opts
  const estimate = opts.estimate || false

  try {
    ({ did } = await validate({
      did, password, label: 'transfer', keyringOpts
    }))
    spender = await _normalizeIDInput(spender)
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)

  let receipt
  try {
    const { tx: increaseApprovalTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'increaseApproval',
        values: [ spender, val ]
      }
    })

    if (estimate) {
      ctx.close()
      const cost = tx.estimateCost(increaseApprovalTx)
      return cost
    }

    receipt = await tx.sendSignedTransaction(increaseApprovalTx)
    ctx.close()
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
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {TypeError|Error}
 */
async function decreaseApproval(opts = {}) {
  _validateApprovalOpts(opts)

  let { did, spender } = opts
  const { password, keyringOpts } = opts

  try {
    ({ did } = await validate({
      did, password, label: 'transfer', keyringOpts
    }))
    spender = await _normalizeIDInput(spender)
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const { tx: decreaseApprovalTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: 'decreaseApproval',
        values: [ spender, val ]
      }
    })
    receipt = await tx.sendSignedTransaction(decreaseApprovalTx)
    ctx.close()
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
  const { web3 } = createContext({ provider: false })
  try {
    const result = web3.utils.toBN(BigNumber(input)).toString()
    return result
  } catch (err) {
    throw err
  }
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
 * @param  {String}   opts.val
 * @param  {?Boolean} opts.withdraw
 * @param  {Object} [opts.keyringOpts]
 * @return {Object}
 * @throws {TypeError}
 */
async function modifyDeposit(opts = {}) {
  if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${opts.password}.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (opts.withdraw && 'boolean' !== typeof opts.withdraw) {
    throw new TypeError(`Expected 'opts.withdraw' to be a boolean. Got ${opts.withdraw}.`)
  }

  let { did, val, withdraw: wd } = opts
  const { password, keyringOpts } = opts

  try {
    ({ did } = await validate({
      did, password, label: wd ? 'withdraw' : 'deposit', keyringOpts
    }))
  } catch (err) {
    throw err
  }

  did = `${AID_PREFIX}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)
  wd = wd || false

  let receipt
  try {
    const { tx: depositTx, ctx } = await tx.create({
      account: acct,
      to: ARA_TOKEN_ADDRESS,
      data: {
        abi: tokenAbi,
        functionName: wd ? 'withdraw' : 'deposit',
        values: [ val ]
      }
    })
    receipt = await tx.sendSignedTransaction(depositTx)
    ctx.close()
    if (receipt.status) {
      debug(wd ? 'withdrew' : 'deposited', constrainTokenValue(val), 'tokens')
    }
    return receipt
  } catch (err) {
    throw err
  }
}

/**
 * Returns current deposit amount
 * @param  {String} did
 * @param  {Object} [keyringOpts]
 * @return {Number}
 * @throws {TypeError|Error}
 */
async function getAmountDeposited(did, keyringOpts) {
  let address
  try {
    did = getIdentifier(did)
    address = await getAddressFromDID(did, keyringOpts)
  } catch (err) {
    throw err
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
  if (!opts.spender || 'string' !== typeof opts.spender) {
    throw new TypeError(`Expected 'opts.spender' to be non-empty Ara DID string. Got ${opts.spender}. Ensure ${opts.spender} is a valid Ara identity.`)
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError(`Expected 'opts.val' to be greater than 0. Got ${opts.val}. Ensure ${opts.val} is a positive number.`)
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError(`Expected 'opts.did' to be non-empty Ara DID string. Got ${opts.did}. Ensure ${opts.did} is a valid Ara identity.`)
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError("Expected 'opts.estimate' to be a boolean")
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError(`Expected 'opts.password' to be a non-empty string. Got ${opts.password}.`)
  }
}

async function _normalizeIDInput(id, keyringOpts) {
  try {
    if (!isAddress(id)) {
      id = getIdentifier(id)
      id = await getAddressFromDID(id, keyringOpts)
    }
  } catch (err) {
    throw err
  }
  return id
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
