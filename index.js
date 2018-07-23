const {
  purchase,
  setPurchaseDelegates
} = require('./purchase')
const { error } = require('ara-console')
const {
  kPriceAddress,
  kLibraryAddress,
  kTempOwnerDid,
  kTempAFSDid
} = require('./constants')

const pify = require('pify')

void async function main() {
  await setPurchaseDelegates({ priceAddress: kPriceAddress, libAddress: kLibraryAddress})
  purchase({ requesterDid: kTempOwnerDid, contentDid: kTempAFSDid })
    .catch((err) => {
      error(err)
    })
}()

module.exports = {
  purchase
}
