const { writeIdentity } = require('ara-identity/util')
const { create } = require('ara-identity')
const context = require('ara-context')()
const { token } = require('../')
const test = require('ava')

const {
  OWNER_PASSWORD: password,
  ARA_TOKEN_ADDRESS,
  DEFAULT_ADDRESS,
  OWNER_MNEMONIC,
  TEMP_OWNER_DID,
} = require('../constants')

const funcMap = [
  token.transfer,
  token.increaseApproval,
  token.decreaseApproval,
  token.approve,
  token.transferFrom
]

test.before(async (t) => {
  const defaultIdentity = await create({ context, mnemonic: OWNER_MNEMONIC, password })
  await writeIdentity(defaultIdentity)

  const { did: { did }, account } = await create({ context, password })
  t.context = { account, did }
})

test('balanceOf(address) invalid address', async (t) => {
  await t.throws(token.balanceOf(), TypeError)
  await t.throws(token.balanceOf({ }), TypeError)
  await t.throws(token.balanceOf(1234), TypeError)
  await t.throws(token.balanceOf([]), TypeError)
})

test('balanceOf(address)', async (t) => {
  const defaultBalance = await token.balanceOf(DEFAULT_ADDRESS)
  t.true(0 < Number(defaultBalance))

  const { account } = t.context
  const newAccountBalance = await token.balanceOf(account.address)
  t.is(newAccountBalance, '0')

  // TODO check balance after transfer
})

test('totalSupply()', async (t) => {
  const supply = await token.totalSupply()
  t.true(0 < Number(supply))
})

test('transfer(opts) valid transfer', async (t) => {
  const { address } = t.context.account
  const did = TEMP_OWNER_DID
  const val = 1

  const beforeNewBalance = Number(await token.balanceOf(address))
  const beforeDefaultBalance = Number(await token.balanceOf(DEFAULT_ADDRESS))

  await token.transfer({ did, password, val, to: address })
  const afterNewBalance = Number(await token.balanceOf(address))
  const afterDefaultBalance = Number(await token.balanceOf(DEFAULT_ADDRESS))
  
  t.true(afterNewBalance === beforeNewBalance + val)
  t.true(afterDefaultBalance === beforeDefaultBalance - val)
})

test('allowance(opts) invalid opts', async (t) => {
  const { address } = t.context.account

  t.plan(10)
  await t.throws(token.allowance(), TypeError)
  await t.throws(token.allowance({ }), TypeError)
  await t.throws(token.allowance([]), TypeError)
  await t.throws(token.allowance({ owner: null }), TypeError)
  await t.throws(token.allowance({ owner: 123 }), TypeError)
  await t.throws(token.allowance({ owner: DEFAULT_ADDRESS }), TypeError)
  await t.throws(token.allowance({ owner: DEFAULT_ADDRESS, spender: null }), TypeError)
  await t.throws(token.allowance({ owner: DEFAULT_ADDRESS, spender: 123 }), TypeError)
  await t.throws(token.allowance({ owner: null, spender: address }), TypeError)
  await t.throws(token.allowance({ owner: 123, spender: address }), TypeError)
})

test('allowance(opts) allowance query', async (t) => {
  const { address } = t.context.account
  let allowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))
  t.is(allowed, 0)

  const did = TEMP_OWNER_DID
  await token.approve({ did, password, val: 1, spender: address })

  allowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))  
  t.is(allowed, 1)
})

test('increaseApproval(opts) valid increase', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))

  const did = TEMP_OWNER_DID
  const val = 10
  await token.increaseApproval({ did, password, DEFAULT_ADDRESS, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))
  t.is(afterAllowed, beforeAllowed + val)
})

test('decreaseApproval(opts) valid decrease', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))

  const did = TEMP_OWNER_DID
  const val = 10
  await token.decreaseApproval({ did, password, DEFAULT_ADDRESS, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))
  t.is(afterAllowed, beforeAllowed - val)
})

test('approve(opts) valid approve', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))

  const did = TEMP_OWNER_DID
  const val = 100
  await token.approve({ did, password, DEFAULT_ADDRESS, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: DEFAULT_ADDRESS, spender: address }))
  t.is(afterAllowed, val)
})

test('transferFrom(opts) valid transfer', async (t) => {
  const { address } = t.context.account
  const did = TEMP_OWNER_DID
  const val = 1

  const beforeNewBalance = Number(await token.balanceOf(address))
  const beforeDefaultBalance = Number(await token.balanceOf(DEFAULT_ADDRESS))

  await token.transferFrom({ did, password, val, to: address })
  const afterNewBalance = Number(await token.balanceOf(address))
  const afterDefaultBalance = Number(await token.balanceOf(DEFAULT_ADDRESS))
  
  t.true(afterNewBalance === beforeNewBalance + val)
  t.true(afterDefaultBalance === beforeDefaultBalance - val)
})

test('invalid generic opts', async (t) => {
  const { did } = t.context

  for (let func of funcMap) {
    await t.throws(func(), TypeError)
    await t.throws(func({ }), TypeError)
    await t.throws(func({ to: ''}), TypeError)
    await t.throws(func({ to: 1234}), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: '1000' }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000 }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did: null }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did: '' }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did: 1234 }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did: 1234 }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did, password: null }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did, password: 123 }), TypeError)
    await t.throws(func({ to: DEFAULT_ADDRESS, val: 1000, did, password }), Error)
  }
})
