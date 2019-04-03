const { web3: { contract: contractUtil  }} = require('ara-util')
const { registry, token } = require('./')
const { abi: registryABI } = require('./build/contracts/Registry.json')
const { REGISTRY_ADDRESS } = require('./constants')

async function getPublished() {
    let contract, ctx
    try {
	    ({ contract, ctx } = await contractUtil.get(registryABI, REGISTRY_ADDRESS))
      console.log('got contract')
    } catch (err) { console.log('err getting contract:', err)}
  
		try {
			const opts = { fromBlock: 0, toBlock: 'latest' }
      opts.filter = { _owner: '0x97f790b3e781441cA32Ae8F44976fDE95c9456a7' }
			const contentDIDs = (await contract.getPastEvents('ProxyDeployed', opts))
        .map(({ returnValues }) => returnValues._contentId.slice(-64))

      return contentDIDs
		} catch (err) { console.log('err getting events:', err) }

	ctx.close()
}
getPublished().then(console.log)