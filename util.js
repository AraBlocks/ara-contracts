const bufferFrom = require('buffer-from')
const isBuffer = require('is-buffer')

// TODO: add to ara-util

function isValidJobId(jobId) {
  if (jobId && ('string' === typeof jobId || isBuffer(jobId)) && 
    (jobId.length === 64 || (jobId.length === 66 && jobId.indexOf('0x') === 0))) {
    return true
  } else {
    return false
  }
}

function isValidArray(arr, fn) {
  if (arr && Array.isArray(arr) && arr.length > 0) {
    arr.forEach(fn)
    return true
  }
  return false
}

module.exports = {
  isValidJobId,
  isValidArray
}
