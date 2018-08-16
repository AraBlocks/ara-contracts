/* eslint-disable no-await-in-loop */

const { abi: tokenAbi } = require('./build/contracts/ARAToken.json')
const { abi: afsAbi } = require('./build/contracts/AFS.json')
const debug = require('debug')('ara-contracts:purchase')
// const account = require('ara-web3/account')
const { info } = require('ara-console')
// const call = require('ara-web3/call')
// const tx = require('ara-web3/tx')

const {
  tx,
  call,
  account,
  contract
} = require('ara-web3')

const {
  kAidPrefix,
  kARATokenAddress
} = require('./constants')

const {
  proxyExists,
  getProxyAddress
} = require('./registry')

const {
  checkLibrary,
  getLibrarySize,
  getLibraryItem
} = require('./library')

const {
  hashDID,
  validate,
  normalize
} = require('ara-util')

/**
 * Purchase contentDid
 * @param  {Object} opts
 * @param  {String} opts.requesterDid
 * @param  {String} opts.contentDid
 * @param  {String} opts.password
 * @throws {Error,TypeError}
 */
async function purchase(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('ara-contracts.purchase: Expecting opts object.')
  } else if ('string' !== typeof opts.requesterDid || !opts.requesterDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty requester DID')
  } else if ('string' !== typeof opts.contentDid || !opts.contentDid) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty content DID')
  } else if ('string' != typeof opts.password || !opts.password) {
    throw TypeError('ara-contracts.purchase: Expecting non-empty password')
  }

  const { requesterDid, password } = opts
  let { contentDid } = opts
  let did
  try {
    ({ did } = await validate({ did: requesterDid, password, label: 'purchase' }))
  } catch (err) {
    throw err
  }

  contentDid = normalize(contentDid)

  debug(did, 'purchasing', contentDid)

  const hIdentity = hashDID(did)
  debug("hashed id", hIdentity)
  did = kAidPrefix + did
  const acct = await account.load({ did, password })

  try {
    await checkLibrary({ requesterDid: did, contentDid })

    if (!(await proxyExists(contentDid))) {
      throw new Error('ara-contracts.purchase: This content does not have a valid proxy contract')
    }

    const proxy = await getProxyAddress(contentDid)
    debug("proxy address", proxy)
    const price = await call({
      abi: afsAbi,
      address: proxy,
      functionName: 'price_'
    })

    const approveTx = await tx.create({
      account: acct,
      to: kARATokenAddress,
      data: {
        abi: tokenAbi,
        functionName: 'approve',
        values: [
          proxy,
          price
        ]
      }
    })

    const receipt = await tx.sendSignedTransaction(approveTx)
    const allowance = await call({
      abi: tokenAbi,
      address: kARATokenAddress,
      functionName: 'allowance',
      arguments: [
        acct.address,
        proxy
      ]
    })
    debug("approved", allowance)
    const purchaseTx = await tx.create({
      account: acct,
      to: proxy,
      data: {
        abi: afsAbi,
        functionName: 'purchase',
        values: [
          hIdentity,
          false
        ]
      }
    })
    // listen to ARAToken event for proxy address
    // const proxyContract = await contract.get(afsAbi, proxy)
    // await proxyContract.events.TEST({ fromBlock: 'latest', function(error) { debug(error) } })
    //   .on('data', (log) => {
    //     const { returnValues: { _sender } } = log
    //     debug("sender address", _sender)
    //   })
    //   .on('changed', (log) => {
    //     debug(`Changed: ${log}`)
    //   })
    //   .on('error', (log) => {
    //     debug(`error:  ${log}`)
    //   })

    const proxyContract = await contract.get(afsAbi, proxy)
    await proxyContract.events.Purchased({ fromBlock: 'latest', function(error) { debug(error) } })
      .on('data', (log) => {
        const { returnValues: { _purchaser, _did, _download } } = log
        debug("purchaser", _purchaser, "did", _did, "download", _download)
      })
      .on('changed', (log) => {
        debug(`Changed: ${log}`)
      })
      .on('error', (log) => {
        debug(`error:  ${log}`)
      })

    await tx.sendSignedTransaction(purchaseTx)

    const size = await getLibrarySize(did)

    const contentId = await getLibraryItem(did, size - 1)

    info(contentId, `added to library (${size})`)
  } catch (err) {
    throw err
  }
}

module.exports = {
  purchase
}
