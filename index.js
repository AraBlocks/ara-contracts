const { purchase } = require('./purchase')
const registry = require('./registry')
const library = require('./library')
const rewards = require('./rewards')
const token = require('./token')
const constants = require('./constants')

void async function main() {
  // try {
    // console.log('transferring...')
    // const receipt = await token.deposit({
    //   did: constants.kTempOwnerDid,
    //   password: constants.kOwnerPassword,
    //   val: '10',
    //   withdraw: true
    // })

  //   const receipt = await token.transfer({
  //     to: constants.kDefaultAddress,
  //     val: '999999950',
  //     did: 'did:ara:cebc55ee22134f2cabdfeb64364d4312ffbb3e887362f613290e6d06bc84bab3',
  //     password: 'lol'
  //   })

  //   const balance = await token.balanceOf(constants.kDefaultAddress)
  //   console.log('balance', balance)
  // } catch (err) {
  //   console.log(err)
  //   throw err
  // }
  const amount = await token.getAmountDeposited(constants.kTempOwnerDid)
  console.log('total deposit', amount)
}()

module.exports = {
  purchase,
  registry,
  library,
  rewards,
  token
}
