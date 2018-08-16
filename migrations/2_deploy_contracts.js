/* eslint no-undef: "off" */

const { web3 } = require('ara-context')()
const { kDefaultAddress } = require('../constants')

const Library = artifacts.require('./Library.sol')
const Token = artifacts.require('./ARAToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = async (deployer) => {
  // await web3.eth.personal.unlockAccount(accounts[2], 'pass')
  // deployer.deploy(Registry, { from: accounts[2] })
  //   .then(() =>
  //     deployer.deploy(Library, Registry.address, { from: accounts[2] })
  //       .then(() =>
  //         deployer.deploy(Token, { from: accounts[2] })))
  deployer.deploy(Registry, { from: kDefaultAddress })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from: kDefaultAddress })
        .then(() =>
          deployer.deploy(Token, { from: kDefaultAddress })))
}
