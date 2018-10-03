const { abi } = require('./build/contracts/AFS.json')

const {
  getAddressFromDID,
  normalize,
  validate,
  web3: {
    isAddress,
    account,
    call,
    tx
  }
} = require('ara-util')

const {
  getProxyAddress,
  proxyExists
} = require('./registry')

async function transferOwnership(opts) {
  if (!opts || 'object' !== typeof opts) {
    throw new TypeError('Expecting opts object')
  } else if (!opts.ownerDid || 'string' !== typeof opts.ownerDid) {
    throw new TypeError('Expecting non-empty owner DID')
  } else if (!opts.password || 'string' !== typeof opts.password) {
    throw new TypeError('Expecting non-empty password')
  } else if (!opts.contentDid || 'string' !== typeof opts.contentDid) {
    throw new TypeError('Expecting non-empty content DID')
  } else if (opts.estimate && 'boolean' !== typeof opts.estimate) {
    throw new TypeError('Expecting boolean for estimate')
  } else if (!opts.newOwnerDid || 'string' !== typeof opts.newOwnerDid) {
    throw new TypeError('Expecting non-empty new owner DID')
  }

  const {
    newOwnerDid,
    contentDid,
    password,
    ownerDid
  } = opts

  let ownerAddress
  let newOwnerAddress
  try {
    await validate({ did: ownerDid, password, label: 'transferOwnership' })
    ownerAddress = await getAddressFromDID(normalize(ownerDid))
    newOwnerAddress = await getAddressFromDID(normalize(newOwnerDid))
  } catch (err) {
    throw err
  }
  
  if (!(await proxyExists(contentDid))) {
    throw new Error('Content does not have a valid proxy contract')
  }

  if (!isAddress(ownerAddress)) {
    throw new Error(`${ownerDid} did not resolve to a valid Ethereum address. 
      Got ${ownerAddress}. Ensure ${ownerDid} is a valid Ara identity.`)
  }

  if (!isAddress(newOwnerAddress)) {
    throw new Error(`${newOwnerDid} did not resolve to a valid Ethereum address. 
      Got ${newOwnerAddress}. Ensure ${newOwnerDid} is a valid Ara identity.`)
  }

  const proxy = await getProxyAddress(contentDid)
  const acct = await account.load({ did: ownerDid, password })
  const transferTx = await tx.create({
    account: acct,
    to: proxy,
    gasLimit: 1000000,
    data: {
      abi,
      functionName: 'transferOwnership',
      values: [ newOwnerAddress ]
    }
  })

  const owner = await call({
    abi,
    address: proxy,
    functionName: 'owner'
  })
  debug('current AFS owner', owner)

  const estimate = opts.estimate || false

  if (estimate) {
    return tx.estimateCost(transferTx)
  }

  return tx.sendSignedTransaction(transferTx)
}

module.exports = {
  transferOwnership
}
