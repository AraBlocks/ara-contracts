/* eslint no-undef: "off" */

const { DEFAULT_ADDRESS } = require('../constants')

const Library = artifacts.require('./Library.sol')
const AraToken = artifacts.require('./AraToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer) => {
  deployer.deploy(Registry, { from: DEFAULT_ADDRESS })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from: DEFAULT_ADDRESS })
        .then(() =>
          deployer.deploy(AraToken, { from: DEFAULT_ADDRESS })))
}
