const { JOB_ID_LENGTH } = require('./constants')
const isBuffer = require('is-buffer')

function isValidJobId(jobId) {
  if (!jobId || ('string' !== typeof jobId && !isBuffer(jobId))) {
    return false
  }

  if (isBuffer(jobId)) {
    jobId = jobId.toString('hex')
  }

  const n = 2
  const isHex = '0x' === jobId.slice(0, n)
  if ((isHex && JOB_ID_LENGTH !== jobId.length - n)
    || (!isHex && (JOB_ID_LENGTH !== jobId.length))) {
    return false
  }

  return true
}

function isValidArray(arr, fn) {
  if (arr && Array.isArray(arr) && 0 < arr.length) {
    if (fn) { 
      arr.forEach(fn)
    }
    return true
  }
  return false
}

module.exports = {
  isValidJobId,
  isValidArray
}
