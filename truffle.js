module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 9545,
      network_id: '*',
      from: '0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64'
    },
    testnet: {
      network_id: 1337,
      host: '34.229.98.210',
      port: 9151,
      from: '0x7c4ebbdc0639554089e0d71fe507e63a01856834',
      gas: 2000000
    },
    localnet: {
      network_id: 12,
      host: 'localhost',
      port: 9546,
      from: '0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64',
      gas: 7000000
    },
    privatenet: {
      network_id: 1337,
      host: 'localhost',
      port: 8545,
      from: '0xe6ecdb604957700f7e3c3057672dfe1b3ad60d64',
      gas: 4000000
    }
  }
}
