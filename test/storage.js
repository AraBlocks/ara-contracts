/* eslint-disable quotes */

const { web3: { account } } = require('ara-util')
const { storage, registry } = require('../')
const test = require('ava')

const {
  PASSWORD: password,
  TEST_OWNER_DID,
  TEST_AFS_DID1
} = require('./_constants')

const {
  sendEthAraAndDeposit,
  mirrorIdentity,
  cleanup
} = require('./_util')

test.before(async (t) => {
  t.context.afsAccount = await mirrorIdentity(TEST_AFS_DID1)
  const { did: contentDid } = t.context.afsAccount
  try {
    t.context.address = await registry.deployProxy({ contentDid, password })
  } catch (err) {
    t.context.address = await registry.getProxyAddress(contentDid)
  }
  await sendEthAraAndDeposit(TEST_OWNER_DID)
})

test.after(async (t) => {
  await cleanup(t.context.afsAccount)
})

test("hasBuffer(opts) read(opts) invalid opts", async (t) => {
  const funcs = [ storage.read, storage.hasBuffer ]
  const promises = []
  for (const func of funcs) {
    promises.push(new Promise(async (resolve) => {
      // opts
      await t.throwsAsync(func(), {instanceOf: TypeError})
      await t.throwsAsync(func('opts'), {instanceOf: TypeError})
      await t.throwsAsync(func({ }), {instanceOf: TypeError})

      // address
      await t.throwsAsync(func({ address: null }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address: '0x123' }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address: 0x123 }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address: { } }), {instanceOf: TypeError})

      // random address to test with
      const address = '0xCd626bc764E1d553e0D75a42f5c4156B91a63F23'

      // fileIndex
      await t.throwsAsync(func({ address }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address, fileIndex: null }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address, fileIndex: '0' }), {instanceOf: TypeError})

      const fileIndex = 0
      // offset
      await t.throwsAsync(func({ address, fileIndex }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address, fileIndex, offset: null }), {instanceOf: TypeError})
      await t.throwsAsync(func({ address, fileIndex, offset: '32' }), {instanceOf: TypeError})
      resolve()
    }))
  }
  await Promise.all(promises)
})

test("write(opts) invalid opts", async (t) => {
  // opts
  await t.throwsAsync(storage.write(), {instanceOf: TypeError})
  await t.throwsAsync(storage.write('opts'), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ }), {instanceOf: TypeError})

  // mtData
  await t.throwsAsync(storage.write({ mtData: null }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData: 'data' }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData: [] }), {instanceOf: TypeError})

  // msData
  const mtData = { }
  await t.throwsAsync(storage.write({ mtData, msData: null }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData: 'data' }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData: 123 }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData: [] }), {instanceOf: TypeError})

  // to
  const msData = { }
  await t.throwsAsync(storage.write({ mtData, msData, to: null }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData, to: '0x123' }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData, to: 0x123 }), {instanceOf: TypeError})
  await t.throwsAsync(storage.write({ mtData, msData, to: { } }), {instanceOf: TypeError})

  // account
  const to = '0xCd626bc764E1d553e0D75a42f5c4156B91a63F23'
  await t.throwsAsync(storage.write({
    account: null,
    mtData,
    msData,
    to
  }), {instanceOf: TypeError})

  await t.throwsAsync(storage.write({
    account: 'data',
    mtData,
    msData,
    to
  }), {instanceOf: TypeError})

  await t.throwsAsync(storage.write({
    account: 123,
    mtData,
    msData,
    to
  }), {instanceOf: TypeError})

  await t.throwsAsync(storage.write({
    account: [],
    mtData,
    msData,
    to
  }), {instanceOf: TypeError})
})

test("hasBuffer(opts) invalid buffer", async (t) => {
  const opts = {
    to: '0xCd626bc764E1d553e0D75a42f5c4156B91a63F23',
    mtData: { },
    msData: { },
    account: { }
  }
  await t.throwsAsync(storage.hasBuffer(opts), {instanceOf: TypeError})
  await t.throwsAsync(storage.hasBuffer(Object.assign({}, opts, { buffer: false })), {instanceOf: TypeError})
  await t.throwsAsync(storage.hasBuffer(Object.assign({}, opts, { buffer: 0xff })), {instanceOf: TypeError})
  await t.throwsAsync(storage.hasBuffer(Object.assign({}, opts, { buffer: [] })), {instanceOf: TypeError})
})

test.serial("hasBuffer(opts) buffer does not exist", async (t) => {
  const { address } = t.context
  const buffer = Buffer.from('61eeb14356ff16909fd4e8b9850c532ea06c2ff2d56ed3d18b48799b0e8eb541', 'hex')

  // nothing written yet, buffer does not exist
  const exists = await storage.hasBuffer({
    fileIndex: 0,
    offset: 0,
    buffer,
    address
  })
  t.true(false === Boolean(exists))
})

test.serial("isEmpty(did) empty", async (t) => {
  const { address } = t.context
  t.is(true, await storage.isEmpty(address))
})

test.serial("hasBuffer(opts) buffer exists", async (t) => {
  const { address } = t.context

  const mtBuffer = '0x0502570200002807424c414b453262000000000000000000000000000000000045daaec2ad1129bfa6b3fdb16cfcfda882b376e9458bcb328360bfe975dd38bf000000000000002e6d632dafde4651f183018a764af80580f65787a0ee48b3b98668ac3f54353c19000000000000004d46102297733272a51faae3b4bee0c5ce02be67f1f5497a59a6f180d120fc3ba8000000000000001f'
  const msBuffer = '0x0502570100004007456432353531390000000000000000000000000000000000610d3b8febd15a0743bf3e8fea52ce7ef40bb517faf47e6c1ada4631b8f4836455fc5abdc37a5d2273ed568f8617c491e01e4613a61f211afe4726170978330efe7f02a9faef11b9c72983a2b85b1c3d10a1daf52816a2a4ba1009b80d356e43a05137d9cbb572f1ef994e8ded9cbd045141f59024de5d24af97e2e240cbdf0bac0ce88170b39baf55c29c17b95f31700499c1fe2ea51a3fc9e7e8f823c0b85c9a8e8f01f5710e7fe61f62e2e4c272bf2b6b0b6a876ac80149bbe9ce9ba83602'

  const acct = await account.load({ did: TEST_OWNER_DID, password })

  // 0x + 32 bytes
  const buffer = mtBuffer.substring(0, 66)

  let exists = await storage.hasBuffer({
    fileIndex: 0,
    offset: 0,
    buffer,
    address
  })
  t.true(false === Boolean(exists))

  const mtData = {
    buffer: mtBuffer,
    offsets: [ 0, 32, 72, 112 ]
  }
  const msData = {
    buffer: msBuffer,
    offsets: [ 0, 32, 96, 160 ]
  }

  // write some data
  await storage.write({
    account: acct,
    to: address,
    mtData,
    msData
  }, false)

  // make sure header now exists
  exists = await storage.hasBuffer({
    fileIndex: 0,
    offset: 0,
    buffer,
    address
  })
  t.true(true === Boolean(exists))
})

test.serial("isEmpty(did) not empty", async (t) => {
  const { address } = t.context
  t.is(false, await storage.isEmpty(address))
})

test.serial("write(opts) read(opts) append", async (t) => {
  const { address } = t.context

  const acct = await account.load({ did: TEST_OWNER_DID, password })
  const mtBuffer = `0x${Buffer.allocUnsafe(40).fill(0xD3ADB33F).toString('hex')}`
  const msBuffer = `0x${Buffer.allocUnsafe(64).fill(0xDEADB33F).toString('hex')}`

  const mtData = {
    offsets: [ 152 ],
    buffer: mtBuffer
  }
  const msData = {
    offsets: [ 224 ],
    buffer: msBuffer
  }

  // append garbage at offsets
  await storage.write({
    account: acct,
    to: address,
    mtData,
    msData
  }, false, true)

  let result = await storage.read({
    fileIndex: 0,
    offset: 152,
    address
  })
  t.is(result, mtBuffer)

  result = await storage.read({
    fileIndex: 1,
    offset: 224,
    address
  })
  t.is(result, msBuffer)
})

test.serial("isEmpty(did) invalid did", async (t) => {
  await t.throwsAsync(storage.isEmpty())
  await t.throwsAsync(storage.isEmpty({ }))
  await t.throwsAsync(storage.isEmpty(null))
  await t.throwsAsync(storage.isEmpty('0x1234'))
})
