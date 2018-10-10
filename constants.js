module.exports = {
  AID_PREFIX: 'did:ara:',

  get REGISTRY_ADDRESS() {
    const privatenet = '0x1e07881fd1e0d78c5359c8828bcf300500f58ba2'
    const testnet = '0x4c0500f568bbd95bc8eeb9915acdebd5a86f02f8'
    const mainnet = ''
    return getAddress(privatenet, testnet, mainnet)
  },

  get LIBRARY_ADDRESS() {
    const privatenet = '0xc7708df08812bc904e3b1973cb35b69727bc1194'
    const testnet = '0x4e3797d2c783dedcc6c29512a91c56c857b2eb49'
    const mainnet = ''
    return getAddress(privatenet, testnet, mainnet)
  },

  get ARA_TOKEN_ADDRESS() {
    const privatenet = '0x586dfaa3a51a7cc557a3052e10a72231181b398b'
    const testnet = '0x6643dd369bacecda73ff92c5fee25f6bf3823106'
    const mainnet = ''
    return getAddress(privatenet, testnet, mainnet)
  },

  TEMP_OWNER_DID: 'did:ara:8a98c8305035dcbb1e8fa0826965200269e232e45ac572d26a45db9581986e67',
  OWNER_PASSWORD: 'pass',
  OWNER_MNEMONIC: 'leg notable ostrich found gym honey leg arrive spend cabbage genuine light',
  // private key: 0x8662c06fab466f44e0b7937812671d07b4e298a609c7d9654e27c1d0d2653f20
  DEFAULT_ADDRESS: '0x105C83b79E9170d7969Ce9806fE0B527b5f879dE',

  TEST_OWNER_ADDRESS: '0x105C83b79E9170d7969Ce9806fE0B527b5f879dE',
  // 0x for ganache, no prefix for geth
  TEST_OWNER_PK: '0x8662c06fab466f44e0b7937812671d07b4e298a609c7d9654e27c1d0d2653f20',
  TEST_OWNER_PASSWORD: 'pass',

  // TODO(cckelly) get a better hold on constants
  TEST_OWNER_ADDRESS_2: '0x1019468D3060F0b8c5d9C432f0c4Db33e28b3582',

  TOKEN_DECIMALS: 18,
  STANDARD_VERSION: '1',
  JOB_ID_LENGTH: 64
}

const rc = require('ara-runtime-configuration')()
const env = rc.web3.network_id

function getAddress(privatenet, testnet, mainnet) {
  let address = privatenet
  switch(env) {
    case 'privatenet':
      address = privatenet
      break;
    case 'testnet':
      address = testnet
      break;
    case 'mainnet':
      address = mainnet
      break;
    default:
      address = privatenet
  }
  return address
}

// kTempOwnerDid: 'did:ara:cebc55ee22134f2cabdfeb64364d4312ffbb3e887362f613290e6d06bc84bab3',
// kOwnerPassword: 'lol',
// kOwnerMnemonic: 'undo cargo steel brick stairs trash hover rent scare ribbon tired output',
// // private key: 0x628a3ff0e47af58d306dfe413114acfded25a8374f562db36d8496f246dbeaf7
// kDefaultAddress: '0x1019468D3060F0b8c5d9C432f0c4Db33e28b3582'

// AFS standard v2: '0x5bd7C0Fcca203A3b5016cd6da530d1A72d0e5413'
// Proxy: '0x7150c203A5A7e833BaED9c98c699eB3b96668aDd'

/**
 * FARMERS:
 *  (1)     DID: did:ara:a51aa651c5a28a7c0a8de007843a00dcd24f3cc893522d3fb093c2bb7a323785
 *      ADDRESS: 0xF9403C6DA32DB4860F1eCB1c02B9A04D37c0e36e
 *          KEY: 0xc169a154b069eabe0bb54cf1bc4abe100e34bcd74d0e32d16d87c00033292b46
 *     MNEMONIC: < offer loop foil panic hobby subway runway deny canyon impose speed ride >
 *  (2)     DID: did:ara:03e5a1ecc9e7c4639dfb3e0d90302c77b51ca083dfaecb64af1c8f15c9fc0683
 *      ADDRESS: 0x70693d8f4e1c9bA1AE0870C35128BaDfDcF28FBc
 *          KEY: 0xb6313da9a02485ad500392d4955017d98794095c666723c463c94d3cb8c6ed52
 *     MNEMONIC: < stock office soft harvest path joy tail alpha topple pen village music >
 *  (3)     DID: did:ara:067cfd3d2e56e80838b59247d1589b9180cc274a8e7c0a930c7d4f8ecf5e95f0
 *      ADDRESS: 0x19d6a7D8bB09e8A6d733a9c8D9fe7b964fD8F45e
 *          KEY: 0x69b91242b15c8f1dcd72cee1a1dbf5be08c0b0db008f819819cebea0ca24bf6e
 *     MNEMONIC: < grant wild either uncover ivory release beyond jungle believe drift topic clever >
 *  (4)     DID: did:ara:e5e6946e25d6c7e4fd0eb716f0361d42a5bcfac663e55f08ab539f4ba0a6faba
 *      ADDRESS: 0x629483C72b5191C1b522E887238a0A522b1D4F74
 *          KEY: 0x32b1acdfc044649631bb22821f661ea5e9dba65e98637f1fa2ec3c3056582acc
 *     MNEMONIC: < snap poet general square silk ranch whip lizard faculty upon cup degree >
 */

// 0xF9403C6DA32DB4860F1eCB1c02B9A04D37c0e36e, 0x70693d8f4e1c9bA1AE0870C35128BaDfDcF28FBc, 0x19d6a7D8bB09e8A6d733a9c8D9fe7b964fD8F45e, 0x629483C72b5191C1b522E887238a0A522b1D4F74
// 10, 20, 30, 40
