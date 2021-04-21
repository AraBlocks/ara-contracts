const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  networks: {
    local: {
      network_id: '*',
      host: 'localhost',
      port: 8545,
      websockets: true
      // gas: 4000000
    },
    testnet: {
      provider: () => new HDWalletProvider(process.env.TESTNET_MNEMONIC, `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`),
      network_id: 3,
      gas: 4000000
    },
    privatenet: {
      network_id: 1337,
      host: 'localhost',
      port: 8545,
      from: '0xa0b3a0ca8523e036a116184c5c07ca932e611d06',
      gas: 8000000,
      websockets: true
    }
  }
}
