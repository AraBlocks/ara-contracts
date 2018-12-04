/* eslint-disable no-await-in-loop */

/**
 * Everything has be done serially here to avoid account nonce discrepancies.
 * Charles Kelly <charles@ara.one>
 */

const { mirrorIdentity } = require('./_util')
const { token } = require('../')
const test = require('ava')

const {
  TEST_OWNER_DID_NO_METHOD,
  PASSWORD: password,
  TEST_OWNER_ADDRESS,
  TEST_DID
} = require('./_constants')

const funcMap1 = [
  token.transfer,
  token.transferFrom
]

const funcMap2 = [
  token.increaseApproval,
  token.decreaseApproval,
  token.approve,
]

test.before(async (t) => {
  t.context.defaultAccount = await mirrorIdentity(TEST_OWNER_DID_NO_METHOD)
  t.context.testAccount = await mirrorIdentity(TEST_DID)
})

test('balanceOf(address) invalid address', async (t) => {
  await t.throwsAsync(token.balanceOf(), TypeError)
  await t.throwsAsync(token.balanceOf({ }), TypeError)
  await t.throwsAsync(token.balanceOf(1234), TypeError)
  await t.throwsAsync(token.balanceOf([]), TypeError)
  await t.throwsAsync(token.balanceOf(TEST_OWNER_ADDRESS), Error)
  await t.throwsAsync(token.balanceOf('did:ara:1234'), Error)
})

test.serial('balanceOf(address)', async (t) => {
  const defaultBalance = await token.balanceOf(TEST_OWNER_DID_NO_METHOD)
  t.true(0 < Number(defaultBalance))

  const totalSupply = await token.totalSupply()
  t.is(Number(defaultBalance), Number(totalSupply))

  const newAccountBalance = await token.balanceOf(TEST_DID)
  t.is(newAccountBalance, '0')
})

test.serial('totalSupply()', async (t) => {
  const supply = await token.totalSupply()
  t.true(0 < Number(supply))
})

test.serial('transfer(opts) valid transfer', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount
  const val = 100

  const beforeDefaultBalance = Number(await token.balanceOf(did))
  const beforeTestBalance = Number(await token.balanceOf(testDID))

  await token.transfer({
    did,
    password,
    val: val.toString(),
    to: testDID
  })

  const afterDefaultBalance = Number(await token.balanceOf(did))
  const afterTestBalance = Number(await token.balanceOf(testDID))

  t.true(afterDefaultBalance === beforeDefaultBalance - val)
  t.true(afterTestBalance === beforeTestBalance + val)
})

test.serial('allowance(opts) allowance query', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  let allowed = Number(await token.allowance({ owner: did, spender: testDID }))
  t.is(allowed, 0)

  const val = 100
  await token.approve({
    did,
    spender: testDID,
    val: val.toString(),
    password
  })

  allowed = Number(await token.allowance({ owner: did, spender: testDID }))
  t.is(allowed, val)
})

test.serial('increaseApproval(opts) valid increase', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  const beforeAllowed = Number(await token.allowance({ owner: did, spender: testDID }))

  const val = 100
  await token.increaseApproval({
    did,
    password,
    val: val.toString(),
    spender: testDID
  })

  const afterAllowed = Number(await token.allowance({ owner: did, spender: testDID }))
  t.is(afterAllowed, beforeAllowed + val)
})

test.serial('decreaseApproval(opts) valid decrease', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  const beforeAllowed = Number(await token.allowance({ owner: did, spender: testDID }))

  const val = 100
  await token.decreaseApproval({
    did,
    password,
    val: val.toString(),
    spender: testDID
  })

  const afterAllowed = Number(await token.allowance({ owner: did, spender: testDID }))
  t.is(afterAllowed, beforeAllowed - val)
})

test.serial('modifyDeposit(opts) valid deposit/withdraw', async (t) => {
  const { did } = t.context.defaultAccount

  const beforeAmount = Number(await token.getAmountDeposited(did))
  t.is(beforeAmount, 0)

  const depositAmount = 100
  await token.modifyDeposit({
    did,
    password,
    val: depositAmount.toString()
  })

  let afterAmount = Number(await token.getAmountDeposited(did))
  t.is(afterAmount, depositAmount)

  await token.modifyDeposit({
    did,
    password,
    val: depositAmount.toString(),
    withdraw: true
  })

  afterAmount = Number(await token.getAmountDeposited(did))
  t.is(afterAmount, 0)
})

test.serial('approve(opts) valid approve', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  const beforeAllowed = Number(await token.allowance({ owner: did, spender: testDID }))

  const val = 500
  await token.approve({
    did,
    password,
    val: val.toString(),
    spender: testDID
  })

  const afterAllowed = Number(await token.allowance({ owner: did, spender: testDID }))

  t.is(afterAllowed, val)
  t.true(beforeAllowed != afterAllowed)
})

test.serial('transferFrom(opts) valid transfer', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  const beforeDefaultBalance = Number(await token.balanceOf(did))
  const beforeTestBalance = Number(await token.balanceOf(testDID))

  const val = 500
  await token.approve({
    did,
    password,
    val: val.toString(),
    spender: testDID
  })

  await token.transferFrom({
    did: testDID,
    password: 'lol',
    val: val.toString(),
    to: testDID,
    from: did
  })

  const afterDefaultBalance = Number(await token.balanceOf(did))
  const afterTestBalance = Number(await token.balanceOf(testDID))

  t.true(afterTestBalance === beforeTestBalance + val)
  t.true(afterDefaultBalance === beforeDefaultBalance - val)
})

test('getAmountDeposited(did) invalid did', async (t) => {
  await t.throwsAsync(token.getAmountDeposited(), TypeError)
  await t.throwsAsync(token.getAmountDeposited({ }), TypeError)
  await t.throwsAsync(token.getAmountDeposited(1234), TypeError)
  await t.throwsAsync(token.getAmountDeposited([]), TypeError)
  await t.throwsAsync(token.getAmountDeposited(TEST_OWNER_ADDRESS), Error)
  await t.throwsAsync(token.getAmountDeposited('did:ara:1234'), Error)
})

test('allowance(opts) invalid opts', async (t) => {
  const { did } = t.context.defaultAccount

  await t.throwsAsync(token.allowance(), TypeError)
  await t.throwsAsync(token.allowance({ }), TypeError)
  await t.throwsAsync(token.allowance([]), TypeError)
  await t.throwsAsync(token.allowance({ owner: null }), TypeError)
  await t.throwsAsync(token.allowance({ owner: 123 }), TypeError)
  await t.throwsAsync(token.allowance({ owner: TEST_OWNER_ADDRESS }), TypeError)
  await t.throwsAsync(token.allowance({ owner: did }))
  await t.throwsAsync(token.allowance({ owner: did, spender: null }), Error)
  await t.throwsAsync(token.allowance({ owner: did, spender: 123 }), Error)
})

test('modifyDeposit(opts) invalid opts', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  await t.throwsAsync(token.modifyDeposit(), TypeError)
  await t.throwsAsync(token.modifyDeposit({ }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: '' }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: 1234 }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: 1000 }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '10.00' }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '-1' }), TypeError)

  // did
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '1000', did: null }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '1000', did: '' }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '1000', did: 1234 }), TypeError)
  await t.throwsAsync(token.modifyDeposit({ to: testDID, val: '1000', did: 1234 }), TypeError)

  // withdraw
  await t.throwsAsync(token.modifyDeposit({
    to: testDID,
    val: '1000',
    did,
    password,
    withdraw: 'true'
  }))

  await t.throwsAsync(token.modifyDeposit({
    to: testDID,
    val: '1000',
    did,
    password,
    withdraw: { }
  }))

  await t.throwsAsync(token.modifyDeposit({
    to: testDID,
    val: '1000',
    did,
    password,
    withdraw: 123
  }))

  // password
  await t.throwsAsync(token.modifyDeposit({
    to: testDID,
    val: '1000',
    did,
    password: null
  }), TypeError)

  await t.throwsAsync(token.modifyDeposit({
    to: testDID,
    val: '1000',
    did,
    password: 123
  }), TypeError)
})

test('invalid generic opts group 1', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  for (const func of funcMap1) {
    await t.throwsAsync(func(), TypeError)
    await t.throwsAsync(func({ }), TypeError)
    await t.throwsAsync(func({ to: '' }), TypeError)
    await t.throwsAsync(func({ to: 1234 }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: 1000 }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: -1000 }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: '10.00' }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: '1000', did: null }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: '1000', did: '' }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: '1000', did: 1234 }), TypeError)
    await t.throwsAsync(func({ to: testDID, val: '1000', did: 1234 }), TypeError)

    await t.throwsAsync(func({
      to: testDID, val: '1000', did, password: null
    }), TypeError)
    await t.throwsAsync(func({
      to: testDID, val: '1000', did, password: 123
    }), TypeError)
  }
})

test('invalid generic opts group 2', async (t) => {
  const { did } = t.context.defaultAccount
  const { did: testDID } = t.context.testAccount

  for (const func of funcMap2) {
    await t.throwsAsync(func(), TypeError)
    await t.throwsAsync(func({ }), TypeError)
    await t.throwsAsync(func({ spender: '' }), TypeError)
    await t.throwsAsync(func({ spender: 1234 }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: 1000 }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: -1000 }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: '10.00' }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: '1000', did: null }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: '1000', did: '' }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: '1000', did: 1234 }), TypeError)
    await t.throwsAsync(func({ spender: testDID, val: '1000', did: 1234 }), TypeError)

    await t.throwsAsync(func({
      spender: testDID, val: '1000', did, password: null
    }), TypeError)
    await t.throwsAsync(func({
      spender: testDID, val: '1000', did, password: 123
    }), TypeError)
  }
})
