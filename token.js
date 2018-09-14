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
  kAidPrefix,
  kTotalSupply,
  kTokenDecimals,
  kAraTokenAddress
} = require('./constants')

const {
  isAddress,
  account,
  call,
  tx
} = require('ara-util/web3')

/**
 * Get the Ara balance of a specific address.
 * @param  {String} address 
 * @return {Number}
 * @throws {TypeError}
 */
async function balanceOf(address) {
  if (!_isValidAddress(address)) {
    throw new TypeError('Address is not a valid Ethereum address')
  }

  let balance
  try {
    balance = await call({
      abi: tokenAbi,
      address: kAraTokenAddress,
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
      address: kAraTokenAddress,
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
    throw new TypeError('Opts must be of type object')
  } else if (!_isValidAddress(opts.owner) || !_isValidAddress(opts.spender)) {
    throw new TypeError('Owner and spender must be valid Ethereum addresses')
  }

  const { owner, spender } = opts

  let allowed
  try {
    allowed = await call({
      abi: tokenAbi,
      address: kAraTokenAddress,
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
    throw new TypeError('Opts must be of type object')
  } else if (!_isValidAddress(opts.to)) {
    throw new TypeError('Address is not a valid Ethereum address')
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')
  }

  let { did } = opts
  const { password, to } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`

  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const transferTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
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

  let { did, spender } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    spender = normalize(spender)
    spender = await getAddressFromDID(spender)
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`
  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const approveTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
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
    throw new TypeError('Opts must be of type object')
  } else if (!_isValidAddress(opts.from)) {
    throw new TypeError('Address to transfer from must be a valid Ethereum address')
  } else if (!_isValidAddress(opts.to)) {
    throw new TypeError('Address to transfer to must be a valid Ethereum address')
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')
  }

  let { did } = opts
  const { password, from, to } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transferFrom' }))
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`

  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const transferFromTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
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

  let { did, spender } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'transfer' }))
    spender = normalize(spender)
    spender = await getAddressFromDID(spender)
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`
  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const increaseApprovalTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
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
    spender = normalize(spender)
    spender = await getAddressFromDID(spender)
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`
  const acct = await account.load({ did, password })

  let { val } = opts
  val = expandTokenValue(val)

  let receipt
  try {
    const increaseApprovalTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
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
 * Expands token amount in Ara to be able to be read by the EVM
 * @param  {String} val   
 * @return {String}
 * @throws {TypeError}
 */
function expandTokenValue(val) {
  if ('string' !== typeof val) {
    throw new TypeError('Val must be of type string')
  }
  if (!val) {
    return '0'
  }
  const input = `${val}e${kTokenDecimals}`
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
    throw new TypeError('Val must be of type string')
  }
  if (!val) {
    return '0'
  }
  
  const input = `${val}e-${kTokenDecimals}`
  return BigNumber(input).toString()
}

/**
 * Deposits Ara to participate in earning rewards
 * @param  {Object}  opts   
 * @param  {String}  opts.did
 * @param  {String}  opts.password
 * @param  {Number}  opts.val
 * @param  {?Boolean} opts.withdraw
 * @return {Object} 
 * @throws {TypeError}
 */
async function deposit(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Opts must be of type object')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')  
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  } else if (opts.withdraw && 'boolean' !== typeof opts.withdraw) {
    throw new TypeError('Expecting boolean.')
  }

  let { did, val, withdraw } = opts
  const { password } = opts

  try {
    ({ did } = await validate({ owner: did, password, label: 'deposit' }))
  } catch (err) {
    throw err
  }

  did = `${kAidPrefix}${did}`
  const acct = await account.load({ did, password })

  val = expandTokenValue(val)
  withdraw = withdraw || false

  let receipt
  try {
    const depositTx = await tx.create({
      account: acct,
      to: kAraTokenAddress,
      data: {
        abi: tokenAbi,
        functionName: withdraw ? 'withdraw' : 'deposit',
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
 * Withdraws Ara from deposit balance
 * @param  {Object} opts   
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Number} opts.val
 * @return {Object} 
 * @throws {TypeError}
 */
async function withdraw(opts = {}) {
  opts = Object.assign(opts, { withdraw: true })
  return deposit(opts)
}

/**
 * Returns current deposit amount
 * @param  {String} did
 * @return {Number} 
 * @throws {TypeError}
 */
async function getAmountDeposited(did) {
  try {
    did = normalize(did)
  } catch (err) {
    throw err
  }

  const address = await getAddressFromDID(did)
  if (!_isValidAddress(address)) {
    throw new TypeError('Address is not a valid Ethereum address')
  }

  let deposited
  try {
    deposited = await call({
      abi: tokenAbi,
      address: kAraTokenAddress,
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
    throw new TypeError('Opts must be of type object')
  } else if (!opts.spender || 'string' !== typeof opts.spender) {
    throw new TypeError('Spender DID URI must be a non-empty string')
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('Approver DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')  
  }
}

function _isValidAddress(address) {
  return address && 'string' === typeof address && isAddress(address)
}

module.exports = {
  constrainTokenValue,
  getAmountDeposited,
  expandTokenValue,
  increaseApproval,
  decreaseApproval,
  transferFrom,
  totalSupply,
  balanceOf,
  allowance,
  transfer,
  withdraw,
  deposit,
  approve
}
