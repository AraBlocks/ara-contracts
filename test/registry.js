const { abi } = require('../build/contracts/Registry.json')
const { REGISTRY_ADDRESS } = require('../constants')
const { web3: { call } } = require('ara-util')
const { web3 } = require('ara-context')()
const ganache = require('ganache-cli')
const { registry } = require('../')
const test = require('ava')

test.before(t => web3.setProvider(ganache.provider()))

test('getNumber()', async (t) => {
  t.pass()
})
