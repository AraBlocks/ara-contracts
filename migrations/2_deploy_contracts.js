/* eslint no-undef: "off" */

const { DEFAULT_ADDRESS } = require('../constants')

const Library = artifacts.require('./Library.sol')
const AraToken = artifacts.require('./AraToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer, network, accounts) => {
  const from = 'privatenet' === network
    ? DEFAULT_ADDRESS
    : accounts[0]

  // deploy
  deployer.deploy(Registry, { from })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from })
        .then(() =>
          deployer.deploy(AraToken, { from })))
}
