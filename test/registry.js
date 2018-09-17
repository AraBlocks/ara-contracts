const { abi } = require('../build/contracts/Registry.json')
const { REGISTRY_ADDRESS } = require('../constants')
const { web3: { call } } = require('ara-util')
const { web3 } = require('ara-context')({ web3: { provider: 'ws://127.0.0.1:8545' } })
const test = require('ava')

test('getNumber()', async (t) => {
  const deployed = new web3.eth.Contract(abi, REGISTRY_ADDRESS)
  let result = await deployed.methods.getNumber().call()
  console.log('result 1', result)
  result = await call({
    abi,
    address: REGISTRY_ADDRESS,
    functionName: 'getNumber'
  })
  console.log('result 2', result)
  t.pass()
})
