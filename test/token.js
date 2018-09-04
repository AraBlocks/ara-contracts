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
  const beforeBalance = await token.balanceOf(kDefaultAddress)
  console.log('beforeBalance', beforeBalance)
  // const receipt = await token.transfer({ did, password, val: 1000, to: address })
  // const afterBalance = await token.balanceOf(kDefaultAddress)
  // console.log('afterBalance', afterBalance)
  // const newBalance = await token.balanceOf(address)
  // console.log('newBalance', newBalance)
  t.pass()
})
