const { writeIdentity } = require('ara-identity/util')
const { create } = require('ara-identity')
const context = require('ara-context')()
const { token } = require('../')
const test = require('ava')

const {
  kOwnerPassword: password,
  kAraTokenAddress,
  kDefaultAddress,
  kOwnerMnemonic,
  kTempOwnerDid,
} = require('../constants')

test.before(async (t) => {
  const defaultIdentity = await create({ context, mnemonic: kOwnerMnemonic, password })
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
  const defaultBalance = await token.balanceOf(kDefaultAddress)
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

test('transfer(opts) invalid opts', async (t) => {
  const { did } = t.context

  t.plan(13)
  await t.throws(token.transfer(), TypeError)
  await t.throws(token.transfer({ }), TypeError)
  await t.throws(token.transfer({ to: ''}), TypeError)
  await t.throws(token.transfer({ to: 1234}), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: '1000' }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: null }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: '' }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password: null }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password: 123 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password }), Error)
})

test('transfer(opts) valid transfer', async (t) => {
  const { address } = t.context.account
  const did = kTempOwnerDid
  const val = 1

  const beforeNewBalance = Number(await token.balanceOf(address))
  const beforeDefaultBalance = Number(await token.balanceOf(kDefaultAddress))

  await token.transfer({ did, password, val, to: address })
  const afterNewBalance = Number(await token.balanceOf(address))
  const afterDefaultBalance = Number(await token.balanceOf(kDefaultAddress))
  
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
  await t.throws(token.allowance({ owner: kDefaultAddress }), TypeError)
  await t.throws(token.allowance({ owner: kDefaultAddress, spender: null }), TypeError)
  await t.throws(token.allowance({ owner: kDefaultAddress, spender: 123 }), TypeError)
  await t.throws(token.allowance({ owner: null, spender: address }), TypeError)
  await t.throws(token.allowance({ owner: 123, spender: address }), TypeError)
})

test('allowance(opts) allowance query', async (t) => {
  const { address } = t.context.account
  let allowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))
  t.is(allowed, 0)

  const did = kTempOwnerDid
  await token.approve({ did, password, val: 1, spender: address })

  allowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))  
  t.is(allowed, 1)
})

test('increaseApproval(opts) invalid opts', async (t) => {
  const { did } = t.context

  t.plan(13)
  await t.throws(token.increaseApproval(), TypeError)
  await t.throws(token.increaseApproval({ }), TypeError)
  await t.throws(token.increaseApproval({ spender: ''}), TypeError)
  await t.throws(token.increaseApproval({ spender: 1234}), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: '1000' }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000 }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did: null }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did: '' }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did, password: null }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did, password: 123 }), TypeError)
  await t.throws(token.increaseApproval({ spender: kDefaultAddress, val: 1000, did, password }), Error)
})

test('increaseApproval(opts) valid increase', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))

  const did = kTempOwnerDid
  const val = 10
  await token.increaseApproval({ did, password, kDefaultAddress, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))
  t.is(afterAllowed, beforeAllowed + val)
})

test('decreaseApproval(opts) invalid opts', async (t) => {
  const { did } = t.context

  t.plan(13)
  await t.throws(token.decreaseApproval(), TypeError)
  await t.throws(token.decreaseApproval({ }), TypeError)
  await t.throws(token.decreaseApproval({ spender: ''}), TypeError)
  await t.throws(token.decreaseApproval({ spender: 1234}), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: '1000' }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000 }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did: null }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did: '' }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did, password: null }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did, password: 123 }), TypeError)
  await t.throws(token.decreaseApproval({ spender: kDefaultAddress, val: 1000, did, password }), Error)
})

test('decreaseApproval(opts) valid decrease', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))

  const did = kTempOwnerDid
  const val = 10
  await token.decreaseApproval({ did, password, kDefaultAddress, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))
  t.is(afterAllowed, beforeAllowed - val)
})

test('approve(opts) invalid opts', async (t) => {
  const { did } = t.context

  t.plan(13)
  await t.throws(token.approve(), TypeError)
  await t.throws(token.approve({ }), TypeError)
  await t.throws(token.approve({ spender: ''}), TypeError)
  await t.throws(token.approve({ spender: 1234}), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: '1000' }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000 }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did: null }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did: '' }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did, password: null }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did, password: 123 }), TypeError)
  await t.throws(token.approve({ spender: kDefaultAddress, val: 1000, did, password }), Error)
})

test('approve(opts) valid approvate', async (t) => {
  const { address } = t.context.account
  const beforeAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))

  const did = kTempOwnerDid
  const val = 100
  await token.approve({ did, password, kDefaultAddress, val, spender: address })

  const afterAllowed = Number(await token.allowance({ owner: kDefaultAddress, spender: address }))
  t.is(afterAllowed, val)
})

test('transferFrom(opts) invalid opts', async (t) => {
  const { did } = t.context

  t.plan(13)
  await t.throws(token.transfer(), TypeError)
  await t.throws(token.transfer({ }), TypeError)
  await t.throws(token.transfer({ to: ''}), TypeError)
  await t.throws(token.transfer({ to: 1234}), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: '1000' }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: null }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: '' }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did: 1234 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password: null }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password: 123 }), TypeError)
  await t.throws(token.transfer({ to: kDefaultAddress, val: 1000, did, password }), Error)
})

test('transferFrom(opts) valid transfer', async (t) => {
  const { address } = t.context.account
  const did = kTempOwnerDid
  const val = 1

  const beforeNewBalance = Number(await token.balanceOf(address))
  const beforeDefaultBalance = Number(await token.balanceOf(kDefaultAddress))

  await token.transferFrom({ did, password, val, to: address })
  const afterNewBalance = Number(await token.balanceOf(address))
  const afterDefaultBalance = Number(await token.balanceOf(kDefaultAddress))
  
  t.true(afterNewBalance === beforeNewBalance + val)
  t.true(afterDefaultBalance === beforeDefaultBalance - val)
})
