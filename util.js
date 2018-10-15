const { BYTES32_LENGTH } = require('./constants')
const isBuffer = require('is-buffer')

function isValidBytes32(bytes32) {
  if (!bytes32 || ('string' !== typeof bytes32 && !isBuffer(bytes32))) {
    return false
  }

  if (isBuffer(bytes32)) {
    bytes32 = bytes32.toString('hex')
  }

  const n = 2
  const isHex = '0x' === bytes32.slice(0, n)
  if ((isHex && BYTES32_LENGTH !== bytes32.length - n)
    || (!isHex && (BYTES32_LENGTH !== bytes32.length))) {
    return false
  }

  return true
}

async function isValidArray(arr, fn) {
  if (arr && Array.isArray(arr) && arr.length > 0) {
    let valid = true
    if (fn) {
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < arr.length; i++) {
        const result = await fn(arr[i], i)
        valid = valid && result
      }
    }
    return valid
  }
  return false
}

module.exports = {
  isValidBytes32,
  isValidArray
}
