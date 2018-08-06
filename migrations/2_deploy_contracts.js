/* eslint no-undef: "off" */

const Library = artifacts.require('./Library.sol')
const Token = artifacts.require('./ARAToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer) => {
  deployer.deploy(Registry, { from: "0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64" })
    .then(() =>
      deployer.deploy(Library, Registry.address, { from: "0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64" })
        .then(() =>
          deployer.deploy(Token, { from: "0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64" })))
}
