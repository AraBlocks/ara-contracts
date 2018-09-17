/* eslint no-undef: "off" */
/* eslint indent: "off" */

const replace = require('replace-in-file')
const constants = require('../constants')
const path = require('path')

const Library = artifacts.require('./Library.sol')
const AraToken = artifacts.require('./AraToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer, network, accounts) => {
  const { DEFAULT_ADDRESS } = constants
  const from = 'privatenet' === network
    ? DEFAULT_ADDRESS
    : accounts[0]

  // deploy
  deployer.deploy(Registry, { from })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from })
        .then(() =>
          deployer.deploy(AraToken, { from })))
            .then(ondeploycomplete)
}

async function ondeploycomplete() {
  const constantsPath = path.resolve(__dirname, '../constants.js')
  const options = {
    files: constantsPath,
    from: [ constants.REGISTRY_ADDRESS, constants.LIBRARY_ADDRESS, constants.ARA_TOKEN_ADDRESS ],
    to: [ Registry.address, Library.address, AraToken.address ]
  }
  console.log('Registry', Registry.address)
  console.log('Library', Library.address)
  console.log('AraToken', AraToken.address)
  await replace(options)
}
