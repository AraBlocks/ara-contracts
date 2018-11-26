const { deployNewStandard } = require('../registry')
const constants = require('../constants')

module.exports = (deployer) => {
  deployer.then(async () => {
    try {
      console.log('Deploying AFS Standard...')
      const address = await new Promise((resolve, reject) => {
        setTimeout(async () => {
          console.log('...deploying')
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
      console.log(`Standard deployed at ${address}.`)
    } catch (err) {
      throw err
    }
  })
}
