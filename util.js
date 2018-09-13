const { JOB_ID_LENGTH } = require('./constants')
const isBuffer = require('is-buffer')

function isValidJobId(jobId) {
  if (jobId && ('string' === typeof jobId || isBuffer(jobId)) &&
    (JOB_ID_LENGTH === jobId.length || (JOB_ID_LENGTH + '0x'.length === jobId.length && 0 === jobId.indexOf('0x')))) {
    return true
  }
  return false
}

function isValidArray(arr, fn) {
  if (arr && Array.isArray(arr) && 0 < arr.length) {
    arr.forEach(fn)
    return true
  }
  return false
}

module.exports = {
  isValidJobId,
  isValidArray
}
