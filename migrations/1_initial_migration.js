/* eslint no-undef: "off" */
const { web3 } = require('ara-context')()

const Migrations = artifacts.require('./Migrations.sol')

module.exports = async (deployer) => {
  // console.log(await web3.eth.getBalance(accounts[2]))
  // await web3.eth.personal.unlockAccount(accounts[2], 'pass')
  // deployer.deploy(Migrations, { from: accounts[2] })
  deployer.deploy(Migrations)
}
