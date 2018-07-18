/* eslint no-undef: "off" */

const Purchase = artifacts.require('./Purchase.sol')
const Library = artifacts.require('./Library.sol')

module.exports = (deployer) => {
  deployer.deploy(Purchase)
  deployer.deploy(Library)
}
