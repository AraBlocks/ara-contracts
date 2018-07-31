const { purchase } = require('./purchase')
const library = require('./library')
const registry = require('./registry')

// (async function main() {
//   await setPurchaseDelegates()
//   await purchase({ requesterDid: kTempOwnerDid, contentDid: kTempAFSDid, price: 10 })
//     .catch((err) => {
//       error(err)
//     })
// }())

module.exports = {
  purchase,
  registry,
  library
}
