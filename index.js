const { purchase } = require('./purchase')
const ownership = require('./ownership')
const registry = require('./registry')
const storage = require('./storage')
const library = require('./library')
const rewards = require('./rewards')
const token = require('./token')

module.exports = {
  purchase,
  registry,
  ownership,
  storage,
  library,
  rewards,
  token
}
