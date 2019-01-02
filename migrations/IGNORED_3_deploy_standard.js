const { deployNewStandard } = require('../registry')
const constants = require('../constants')

module.exports = (deployer, network) => {
  // deployer.then(async () => {
  //   const { TEMP_OWNER_DID, ROPSTEN_DEPLOY_DID, OWNER_PASSWORD } = constants

  //   let requesterDid
  //   let password
  //   if ('privatenet' === network || 'local' === network) {
  //     requesterDid = TEMP_OWNER_DID
  //     password = OWNER_PASSWORD
  //   } else if ('testnet' === network) {
  //     requesterDid = ROPSTEN_DEPLOY_DID
  //     password = process.env.TESTNET_PASSWORD
  //   }

  //   try {
  //     console.log('\tDeploying AFS Standard...')
  //     const address = await new Promise((resolve, reject) => {
  //       setTimeout(async () => {
  //         console.log('\t...deploying')
  //         try {
  //           const a = await deployNewStandard({
  //             requesterDid,
  //             password,
  //             version: constants.STANDARD_VERSION,
  //             paths: constants.STANDARD_DEPS_PATHS
  //           })
  //           resolve(a)
  //         } catch (err) {
  //           reject(err)
  //         }
  //       }, 15000)
  //     })
  //     console.log(`\tStandard deployed at ${address}.`)
  //   } catch (err) {
  //     throw err
  //   }
  // })
}
