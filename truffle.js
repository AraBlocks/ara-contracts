const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = 'obscure devote melt spy identify average auction stereo palm penalty online cable'

module.exports = {
  networks: {
    local: {
      network_id: '*',
      host: 'localhost',
      port: 8545,
      gas: 4000000
    },
    testnet: {
      network_id: 3,
      host: '54.197.216.73',
      port: 9500,
      from: '0xd0ea4566bbe57e2f0c1c1d0036b8f779bc71ec63',
      gas: 4000000
    },
    privatenet: {
      network_id: 1337,
      host: 'localhost',
      port: 8545,
      from: '0x105c83b79e9170d7969ce9806fe0b527b5f879de',
      gas: 8000000
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/4c11d1f5ccb84780939bc78edaeef7ce", 1)
      },
      network_id: 3,
      gas: 2000000
    }
  }
}
