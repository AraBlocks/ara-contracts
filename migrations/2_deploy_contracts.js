/* eslint no-undef: "off" */

const { web3 } = require('ara-context')()
const { kDefaultAddress } = require('../constants')

const Library = artifacts.require('./Library.sol')
const Token = artifacts.require('./ARAToken.sol')
const Registry = artifacts.require('./Registry.sol')
const Jobs = artifacts.require('./Jobs.sol')

module.exports = (deployer) => {
  deployer.deploy(Registry, { from: kDefaultAddress })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from: kDefaultAddress })
        .then(() =>
          deployer.deploy(Token, { from: kDefaultAddress })))
            .then(() => 
              deployer.deploy(Jobs, Token.address, Registry.address, { from: kDefaultAddress }))
}
