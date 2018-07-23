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
  process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });
  await setPurchaseDelegates()
  await purchase({ requesterDid: kTempOwnerDid, contentDid: kTempAFSDid, price: 10 })
    .catch((err) => {
      error(err)
    })
}()

module.exports = {
  purchase
}
