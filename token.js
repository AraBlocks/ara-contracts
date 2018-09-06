const { abi: tokenAbi } = require('./build/contracts/AraToken.json')
const BigNumber = require('bignumber.js')
const { web3 } = require('ara-context')()

const {
  kAraTokenAddress,
  kTotalSupply,
  kTokenDecimals
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

  const { did, password, to } = opts
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

  const { did, password, spender } = opts
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
 * @param  {String} opts.to
 * @param  {String} opts.did
 * @param  {String} opts.password
 * @param  {Number} opts.val
 * @return {Object} 
 * @throws {TypeError|Error} 
 */
async function transferFrom(opts = {}) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Opts must be of type object')
  } else if (!_isValidAddress(opts.to)) {
    throw new TypeError('Address to transfer to must be a valid Ethereum address')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  }

  const { did, password, to } = opts
  const acct = await account.load({ did, password })
  const { address } = acct

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
        values: [ address, to, val ]
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

  const { did, password, spender } = opts
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

  const { did, password, spender } = opts
  let { val } = opts
  val = expandTokenValue(val)
  const acct = await account.load({ did, password })

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
 * @return {BN}
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
  return web3.utils.toBN(BigNumber(input))
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

function _validateApprovalOpts(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Opts must be of type object')
  } else if (!_isValidAddress(opts.spender)) {
    throw new TypeError('Spender address must be a valid Ethereum address')
  } else if (!opts.val || 0 >= Number(opts.val)) {
    throw new TypeError('Value must be greater than 0')
  } else if (!opts.did || 'string' !== typeof opts.did) {
    throw new TypeError('DID URI must be non-empty string')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Password must be non-empty string')  
  }
}

function _isValidAddress(address) {
  return address && 'string' === typeof address && isAddress(address)
}

module.exports = {
  increaseApproval,
  decreaseApproval,
  transferFrom,
  totalSupply,
  balanceOf,
  allowance,
  transfer,
  approve
}
