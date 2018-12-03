const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  networks: {
    local: {
      network_id: '*',
      host: 'localhost',
      port: 8545,
      gas: 4000000
    },
    testnet: {
      provider: () => {
        return new HDWalletProvider(process.env.TESTNET_MNEMONIC, `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`)
      },
      network_id: 3,
      gas: 4000000
    },
    privatenet: {
      network_id: 1337,
      host: 'localhost',
      port: 8545,
      from: '0x105c83b79e9170d7969ce9806fe0b527b5f879de',
      gas: 8000000
    }
  }
}
