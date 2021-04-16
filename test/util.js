const { randomBytes } = require('ara-crypto')
const test = require('ava')
const util = require('../util')

test('isValidJobId(jobId)', (t) => {
  let result = util.isValidJobId()
  t.false(result)

  result = util.isValidJobId(123)
  t.false(result)

  result = util.isValidJobId({ })
  t.false(result)

  let jobId = randomBytes(32)
  result = util.isValidJobId(jobId)
  t.true(result)

  jobId = jobId.toString('hex')
  result = util.isValidJobId(jobId)
  t.true(result)

  jobId = `0x${jobId}`
  result = util.isValidJobId(jobId)
  t.true(result)
})

test('isValidArray(arr, fn)', async (t) => {
  let result = await util.isValidArray()
  t.false(result)

  result = await util.isValidArray(1)
  t.false(result)

  result = await util.isValidArray('123')
  t.false(result)

  result = await util.isValidArray([])
  t.false(result)

  result = await util.isValidArray([ 1, 2, 3 ])
  t.true(result)

  result = await util.isValidArray([ 'apple', 3, 'banana', {} ])
  t.true(result)
})
