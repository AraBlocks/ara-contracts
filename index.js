const { error } = require('ara-console')

const {
  kTempOwnerDid,
  kTempAFSDid
} = require('./constants')

const {
  purchase,
  setPurchaseDelegates
} = require('./purchase');

(async function main() {
  await setPurchaseDelegates()
  await purchase({ requesterDid: kTempOwnerDid, contentDid: kTempAFSDid, price: 10 })
    .catch((err) => {
      error(err)
    })
}())

module.exports = {
  purchase
}
