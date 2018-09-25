/* eslint no-undef: "off" */
/* eslint indent: "off" */

const replace = require('replace-in-file')
const constants = require('../constants')
const { web3 } = require('ara-context')()
const path = require('path')

const Library = artifacts.require('./Library.sol')
const AraToken = artifacts.require('./AraToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const { DEFAULT_ADDRESS, TEST_OWNER_ADDRESS } = constants
    const from = 'privatenet' === network
      ? DEFAULT_ADDRESS
      : TEST_OWNER_ADDRESS

    // this account needs to match DID to be used with testing
    // so needs to be unlocked on local ganache node
    if ('local' === network) {
      if (!accounts.includes(constants.TEST_OWNER_ADDRESS)) {
        await web3.eth.personal.importRawKey(constants.TEST_OWNER_PK, constants.PASSWORD)
      }
      await web3.eth.personal.unlockAccount(constants.TEST_OWNER_ADDRESS, constants.PASSWORD, 0)
      await web3.eth.sendTransaction({ from: accounts[0], to: constants.TEST_OWNER_ADDRESS, value: 1000000000000000000 })
      await web3.eth.sendTransaction({ from: accounts[0], to: constants.TEST_OWNER_ADDRESS_2, value: 1000000000000000000 })
    }

    // deploy
    await deployer.deploy(Registry, { from })
    await deployer.deploy(Library, Registry.address, { from })
    await deployer.deploy(AraToken, { from })
    await ondeploycomplete()
  })
}

async function ondeploycomplete() {
  const constantsPath = path.resolve(__dirname, '../constants.js')
  const options = {
    files: constantsPath,
    from: [ constants.REGISTRY_ADDRESS, constants.LIBRARY_ADDRESS, constants.ARA_TOKEN_ADDRESS ],
    to: [ Registry.address, Library.address, AraToken.address ]
  }
  await replace(options)
}
