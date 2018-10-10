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
      host: '52.90.17.11',
      port: 9500,
      from: '0x105c83b79e9170d7969ce9806fe0b527b5f879de',
      gas: 4000000
    },
    privatenet: {
      network_id: 1337,
      host: 'localhost',
      port: 8545,
      from: '0x105c83b79e9170d7969ce9806fe0b527b5f879de',
      gas: 4700000
    }
  }
}
