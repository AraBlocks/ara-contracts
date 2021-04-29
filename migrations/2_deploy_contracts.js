/* eslint no-console: "off" */
/* eslint no-undef: "off" */
/* eslint indent: "off" */

const createContext = require('ara-context')
const replace = require('replace-in-file')
const path = require('path')

const { compileAndDeployAraContracts } = require('../factory')
const { deployNewStandard } = require('../registry')
const constants = require('../constants')

const AraRegistry = artifacts.require('./AraRegistry.sol')

module.exports = (deployer, network, defaultAccounts) => {
  deployer.then(async () => {
    const {
      DEFAULT_ADDRESS,
      ROPSTEN_DEPLOY_ADDRESS,
      MAINNET_DEPLOY_ADDRESS,
      KOVAN_DEPLOY_ADDRESS
    } = constants

    let from
    if ('privatenet' === network) {
      from = DEFAULT_ADDRESS
    } else if ('develop' === network) {
      const index = 0
      from = defaultAccounts[index]
    } else if ('testnet' === network) {
      from = ROPSTEN_DEPLOY_ADDRESS
    } else if ('kovan-fork' === network || 'kovan' === network) {
      from = KOVAN_DEPLOY_ADDRESS
    } else if ('mainnet' === network) {
      from = MAINNET_DEPLOY_ADDRESS
    } else {
      from = DEFAULT_ADDRESS
    }

    // this account needs to match DID to be used with testing
    // so needs to be unlocked on local ganache node
    if ('local' === network) {
      const ctx = createContext({ web3: { provider: 'direct' } })
      await ctx.ready()
      const { web3 } = ctx
      const accounts = await web3.eth.getAccounts()

      if (!accounts.includes(constants.DEFAULT_ADDRESS)) {
        await web3.eth.personal.importRawKey(
          constants.TEST_OWNER_PK,
          constants.OWNER_PASSWORD
        )
      }

      await web3.eth.personal.unlockAccount(
        constants.DEFAULT_ADDRESS,
        constants.OWNER_PASSWORD,
        0
      )

      await web3.eth.sendTransaction({ from: accounts[0], to: constants.DEFAULT_ADDRESS, value: web3.utils.toWei('10', 'ether') })
      await web3.eth.sendTransaction({ from: accounts[0], to: constants.TEST_OWNER_ADDRESS_2, value: web3.utils.toWei('1', 'ether') })
      ctx.close()
    }

    // deploy
    await deployer.deploy(AraRegistry, { from })
    await ondeployararegistrycomplete()
    if ('local' === network || 'privatenet' === network) {
      await deploycore()
      await deploystandard()
    }
  })
}

async function ondeployararegistrycomplete() {
  const constantsPath = path.resolve(__dirname, '../constants.js')
  const options = {
    files: constantsPath,
    from: [ constants.ARA_REGISTRY_ADDRESS ],
    to: [ AraRegistry.address ]
  }

  await replace(options)
}

async function deploycore() {
  console.log('\tDeploying Registry, Library, and Token...')
  const {
    registryAddress,
    libraryAddress,
    tokenAddress
  } = await compileAndDeployAraContracts({
    masterDid: constants.TEMP_OWNER_DID,
    password: constants.OWNER_PASSWORD
  })
  console.log(`\tDeployed Registry (${registryAddress})`)
  console.log(`\tDeployed Library (${libraryAddress})`)
  console.log(`\tDeployed Token (${tokenAddress})`)
}

async function deploystandard() {
  console.log('\tDeploying AFS Standard...')
  const address = await new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const a = await deployNewStandard({
          requesterDid: constants.TEMP_OWNER_DID,
          password: constants.OWNER_PASSWORD,
          version: constants.TEST_STANDARD_VERSION,
          paths: constants.STANDARD_DEPS_PATHS
        })
        resolve(a)
      } catch (err) {
        reject(err)
      }
    }, 5000)
  })
  console.log(`\tStandard deployed at ${address}.`)
  console.log('\tDeploying AFS Estimate Standard...')
  const estimateAddress = await new Promise((resolve, reject) => {
    setTimeout(async () => {
      console.log('\t...deploying')
      try {
        const a = await deployNewStandard({
          requesterDid: constants.TEMP_OWNER_DID,
          password: constants.OWNER_PASSWORD,
          version: `${constants.TEST_STANDARD_VERSION}_estimate`,
          paths: constants.ESTIMATE_DEPS_PATHS,
          compiledPath: './build/contracts/AFSestimate.json'
        })
        resolve(a)
      } catch (err) {
        reject(err)
      }
    }, 5000)
  })
  console.log(`\tEstimate standard deployed at ${estimateAddress}`)
}
