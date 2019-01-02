/* eslint no-undef: "off" */
/* eslint indent: "off" */

const { compileAndDeployAraContracts } = require('../factory')
const { deployNewStandard } = require('../registry')
const createContext = require('ara-context')
const replace = require('replace-in-file')
const constants = require('../constants')
const path = require('path')

const AraFactory = artifacts.require('./AraFactory.sol')

module.exports = (deployer, network, defaultAccounts) => {
  deployer.then(async () => {
    const { DEFAULT_ADDRESS, TEST_OWNER_ADDRESS } = constants

    let from
    if ('privatenet' === network) {
      from = DEFAULT_ADDRESS
    } else if ('develop' === network) {
      const index = 0
      from = defaultAccounts[index]
    } else {
      from = TEST_OWNER_ADDRESS
    }

    // this account needs to match DID to be used with testing
    // so needs to be unlocked on local ganache node
    if ('local' === network) {
      const ctx = createContext()
      await ctx.ready()
      const { web3 } = ctx
      const accounts = await web3.eth.getAccounts()
      if (!accounts.includes(constants.TEST_OWNER_ADDRESS)) {
        await web3.eth.personal.importRawKey(constants.TEST_OWNER_PK, constants.OWNER_PASSWORD)
      }
      await web3.eth.personal.unlockAccount(constants.TEST_OWNER_ADDRESS, constants.OWNER_PASSWORD, 0)
      await web3.eth.sendTransaction({ from: accounts[0], to: constants.TEST_OWNER_ADDRESS, value: web3.utils.toWei('10', 'ether') })
      await web3.eth.sendTransaction({ from: accounts[0], to: constants.TEST_OWNER_ADDRESS_2, value: web3.utils.toWei('1', 'ether') })
      ctx.close()
    }

    // deploy
    await deployer.deploy(AraFactory, { from })
    await ondeployfactorycomplete()
    if ('local' === network || 'privatenet' === network) {
      await deploycore()
      await deploystandard()
    }
  })
}

async function ondeployfactorycomplete() {
  const constantsPath = path.resolve(__dirname, '../constants.js')
  const options = {
    files: constantsPath,
    from: [ constants.FACTORY_ADDRESS ],
    to: [ AraFactory.address ]
  }
  await replace(options)
}

async function deploycore() {
 try {
  console.log('\tDeploying Ara Registry, Library, and Token...')
  const {
    registryAddress,
    libraryAddress,
    tokenAddress
  } = await compileAndDeployAraContracts({
    masterDid: constants.TEMP_OWNER_DID,
    password: constants.OWNER_PASSWORD
  })
  console.log(`\tDeployed Registry (${registryAddress}), Library (${libraryAddress}), and Token (${tokenAddress})`)
 } catch (err) {
  throw err
 }
}

async function deploystandard() {
  try {
    console.log('\tDeploying AFS Standard...')
    const address = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        console.log('\t...deploying')
        try {
          const a = await deployNewStandard({
            requesterDid: constants.TEMP_OWNER_DID,
            password: constants.OWNER_PASSWORD,
            version: constants.STANDARD_VERSION,
            paths: constants.STANDARD_DEPS_PATHS
          })
          resolve(a)
        } catch (err) {
          reject(err)
        }
      }, 15000)
    })
    console.log(`\tStandard deployed at ${address}.`)
  } catch (err) {
    throw err
  }
}
