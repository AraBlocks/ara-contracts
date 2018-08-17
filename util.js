const bufferFrom = require('buffer-from')
const isBuffer = require('is-buffer')

// TODO: add to ara-util

function ethify(x, hexify = false) {
  return hexify ? '0x'+toHex(x) : '0x' + x
}

function toHex(buf) {
  if (isBuffer(buf)) {
    return buf.toString('hex')
  } else if ('number' == typeof buf) {
    return toHex(bufferFrom([buf]))
  } else if ('string' == typeof buf) {
    return toHex(bufferFrom(buf))
  } else {
    return toHex(bufferFrom(buf))
  }
}

function fromHex(bytes) {
  if ('string' == typeof bytes) {
    bytes = bytes.replace(/^0x/, '')
    return bufferFrom(bytes, 'hex')
  } else if (bytes) {
    return bufferFrom(bytes.toString(), 'hex')
  } else {
    return null
  }
}

function isValidJobId(jobId) {
  if (jobId && ('string' !== typeof jobId || isBuffer(jobId)) && 
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
  toHex,
  ethify,
  fromHex,
  isValidJobId,
  isValidArray
}
