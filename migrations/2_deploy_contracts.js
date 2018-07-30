/* eslint no-undef: "off" */

const AFS = artifacts.require('./AFS.sol')
const Library = artifacts.require('./Library.sol')
const Token = artifacts.require('./ARAToken.sol')
const Registry = artifacts.require('./Registry.sol')

module.exports = (deployer) => {
  deployer.deploy(Registry)
    .then(() => {
      return deployer.deploy(Library, Registry.address)
      .then(() => {
        return deployer.deploy(Token)
        .then(() => {
          return deployer.deploy(AFS, Library.address, Token.address)
        })
      })
    })
}
