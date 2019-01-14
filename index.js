const { purchase } = require('./purchase')
const ownership = require('./ownership')
const registry = require('./registry')
const storage = require('./storage')
const library = require('./library')
const rewards = require('./rewards')
const factory = require('./factory')
const token = require('./token')

module.exports = {
  ownership,
  purchase,
  registry,
  storage,
  library,
  rewards,
  factory,
  token
}
