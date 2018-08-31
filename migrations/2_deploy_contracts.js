/* eslint no-undef: "off" */

const { web3 } = require('ara-context')()
const { kDefaultAddress } = require('../constants')

const Library = artifacts.require('./Library.sol')
const AraToken = artifacts.require('./AraToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer) => {
  deployer.deploy(Registry, { from: kDefaultAddress })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from: kDefaultAddress })
        .then(() =>
          deployer.deploy(AraToken, { from: kDefaultAddress })))
}
