module.exports = {
  AID_PREFIX: 'did:ara:',

  get WEB3_NETWORK() {
    return rc.web3.network_id
  },

  get REGISTRY_ADDRESS() {
    const local = '0xaee569f44f6d0bd42343887fa622666e66ac1458'
    const privatenet = '0x899cb766f5bd33dac2e6805bcb46456265096ca5'
    const testnet = '0x4c0500f568bbd95bc8eeb9915acdebd5a86f02f8'
    const mainnet = ''
    return getAddress(local, privatenet, testnet, mainnet)
  },

  get LIBRARY_ADDRESS() {
    const local = '0xdfef8725487ffc1b4d2adf7b29b500d06ff96a5c'
    const privatenet = '0x11af1540b442a3d05754ae403eed2a9227628f86'
    const testnet = '0x4e3797d2c783dedcc6c29512a91c56c857b2eb49'
    const mainnet = ''
    return getAddress(local, privatenet, testnet, mainnet)
  },

  get ARA_TOKEN_ADDRESS() {
    const local = '0xa6af09a9c3caac172ab508ccef807dc179ec1904'
    const privatenet = '0xe882fbca0dfb8a9b7c712bdcc28936d98e0734f9'
    const testnet = '0x6643dd369bacecda73ff92c5fee25f6bf3823106'
    const mainnet = ''
    return getAddress(local, privatenet, testnet, mainnet)
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

function getAddress(local, privatenet, testnet, mainnet) {
  let address
  switch (module.exports.WEB3_NETWORK) {
  case 'local':
    address = local
    break
  case 'privatenet':
    address = privatenet
    break
  case 'testnet':
    address = testnet
    break
  case 'mainnet':
    address = mainnet
    break
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
 * TEST IDs:
 *  (1)     DID: did:ara:77da0a6389fd2942d30c794c7a7dd61c97d7f7b0ee3a795100d171404f9073e0
 *      ADDRESS: 0xfe710619a6d1c5ebc64137e14274cf241f99fc65
 *          KEY: 0x531b61453fbe1dd07ed57e6ebb0f05d0a990285ed83045040133e5cf202c6830
 *     MNEMONIC: < naive shrimp confirm vault seed baby deny happy equal chronic where grass >
 *
 *  (2)     DID: did:ara:b2dc6cc7fb4606d2fc17bb07462668b1a25994af77071e39ac60948f8b55023c
 *      ADDRESS: 0x642745c23733143b518002e02a627ad505df2826
 *          KEY: 0x41de20fda97629a8bebe802a946e21c6ebd1a5b2f3f1698272acc60c770ba18d
 *     MNEMONIC: < become initial climb snow eight develop exclude tooth marriage mirror champion sponsor >
 *
 *  (3)     DID: did:ara:5cb1634bd218d1a29053a764ef0f7945bff862477905eb5bb31cc3eb56d61ef4
 *      ADDRESS: 0x4fc75e4957cb3acd8069c356077c9b708812ade9
 *          KEY: 0x008d6f00bc9b66e7ecff45628f148d1d4f8c75acd6b741b18decf91e405d5d7e
 *     MNEMONIC: < chuckle total inquiry rebuild fruit cousin excess century crush tag test fresh >
 *
 *  (4)     DID: did:ara:08228219008e3c7ab8b7f23a161c196be44ff33525ebea01d841b707b34b7adc
 *      ADDRESS: 0x75111692d6b0cf3371ec243be04954d3ddec00ed
 *          KEY: 0x0a613c9d539fbf6fe9d834b612ad010283753637d3164605416cdbb6c50340ee
 *     MNEMONIC: < learn coach patrol senior bone april idea cheap globe baby guilt subject >
 */

// 0xF9403C6DA32DB4860F1eCB1c02B9A04D37c0e36e, 0x70693d8f4e1c9bA1AE0870C35128BaDfDcF28FBc, 0x19d6a7D8bB09e8A6d733a9c8D9fe7b964fD8F45e, 0x629483C72b5191C1b522E887238a0A522b1D4F74
// 10, 20, 30, 40
