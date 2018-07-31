const { purchase } = require('./purchase')
const { error } = require('ara-console')
const library = require('./library')
const registry = require('./registry')

const {
  kTempOwnerDid,
  kTempAFSDid
} = require('./constants')

(async function main() {
  await setPurchaseDelegates()
  await purchase({ requesterDid: kTempOwnerDid, contentDid: kTempAFSDid, price: 10 })
    .catch((err) => {
      error(err)
    })
}())

module.exports = {
  purchase,
  registry,
  library
}
