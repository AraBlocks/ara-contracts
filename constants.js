const path = require('path')

module.exports = {
  AID_PREFIX: 'did:ara:',

  get WEB3_NETWORK() {
    return rc.web3.network_id
  },

  get REGISTRY_ADDRESS() {
    const local = '0x658b1e9C3484FB2BF4d91AeF066E2C3803F69DF9'
    const privatenet = '0xFE751D4857e5E1D2d838C49c019D68F288138F94'
    const testnet = '0xdB8f8D6cc69A346D608e64C2DDb5b3Ed7e4B32D6'
    const mainnet = ''
    return getAddress(local, privatenet, testnet, mainnet)
  },

  get LIBRARY_ADDRESS() {
    const local = '0x37BEFdC72D5b9680d4e33eF7aEc8adEe01817E2F'
    const privatenet = '0x280702E2e45cdF63C1d01Bfc72746C02f1892f51'
    const testnet = '0xeC26659b209e9e89a23d26298BA0359B1b6C7f76'
    const mainnet = ''
    return getAddress(local, privatenet, testnet, mainnet)
  },

  get ARA_TOKEN_ADDRESS() {
    const local = '0xDBAB08A3f456814aaFb98E339A25E3d7c4C48151'
    const privatenet = '0x217C38E95c889aE33AEB7F4422c7241974a1605E'
    const testnet = '0x06be7386F99C38d26d53d83CBf1b9F438930694B'
    const mainnet = '0xa92E7c82B11d10716aB534051B271D2f6aEf7Df5'
    return getAddress(local, privatenet, testnet, mainnet)
  },

  get ARA_REGISTRY_ADDRESS() {
    const local = '0xf996af566992c7e34e6fd0bd3df79ec16296f5aa'
    const privatenet = '0x19a33cbb0c43baa965b262ca382f367309ac3622'
    const testnet = '0x6bda4b9fcb082e72b30081393d4ae7b05360e517'
    const mainnet = '0xf8314584346fc84e96b36113784f6b562e5b01af'
    return getAddress(local, privatenet, testnet, mainnet)
  },

  REGISTRY_LABEL: 'Registry.sol:Registry',
  LIBRARY_LABEL: 'Library.sol:Library',
  TOKEN_LABEL: 'AraToken.sol:AraToken',

  REGISTRY_NAME: 'Registry',
  LIBRARY_NAME: 'Library',
  TOKEN_NAME: 'AraToken',

  TEMP_OWNER_DID: 'did:ara:9f26296a16e3260b77a165db15646b8a85f2cd590577ea2872c6bbbffed911a2',
  OWNER_PASSWORD: 'pass',
  // private key: 0xc02898ee5e5956ed9a4573906419fb6688ce54f40beaa4f8a9c314253f5326c0
  DEFAULT_ADDRESS: '0xa0b3a0ca8523e036a116184c5c07ca932e611d06',

  ROPSTEN_DEPLOY_DID: 'did:ara:f07e6462ff1fe42af1f98e2bb474936b60a4fc05669458f60dfdc98f1750f1b9',
  ROPSTEN_DEPLOY_ADDRESS: '0x91287ec5e2eff90bdb1750abe9359d7576f744d3',

  MAINNET_DEPLOY_DID: 'did:ara:4de9f36634e8df9d0201c8537320df5dbf1a7ef5057ca8b570e22b743d41225b',
  MAINNET_DEPLOY_ADDRESS: '0xe4127f775e738f30ca3672f62d0f63fd3aab66b8',

  TEST_OWNER_ADDRESS: '0xa0b3a0ca8523e036a116184c5c07ca932e611d06',
  // 0x for ganache, no prefix for geth
  TEST_OWNER_PK: '0xc02898ee5e5956ed9a4573906419fb6688ce54f40beaa4f8a9c314253f5326c0',
  TEST_OWNER_PASSWORD: 'pass',

  // TODO(cckelly) get a better hold on constants
  TEST_OWNER_ADDRESS_2: '0x1019468D3060F0b8c5d9C432f0c4Db33e28b3582',

  // privatenet -- version: 1, password: estimate, address: 0x6A8Fa21A4a1fd9EDed403EF714eC767E8581f724
  STANDARD_ESTIMATE_PROXY: '5f5afd026a2d6e1ed85eb9d6086a936e39a44c47d220a1e4fcc569cdcf738501',

  TOKEN_DECIMALS: 18,
  STANDARD_VERSION: '1',
  REGISTRY_VERSION: '1',
  LIBRARY_VERSION: '1',
  TOKEN_VERSION: '1',
  JOB_ID_LENGTH: 64,
  STANDARD_DEPS_PATHS: [ './contracts/ignored_contracts/AFS.sol', './contracts/ignored_contracts/Library.sol', './contracts/ignored_contracts/Registry.sol', './contracts/AraProxy.sol', './contracts/ignored_contracts/AraToken.sol' ],
  ESTIMATE_DEPS_PATHS: [ './contracts/ignored_contracts/AFS_estimate.sol', './contracts/ignored_contracts/Library.sol', './contracts/ignored_contracts/Registry.sol', './contracts/AraProxy.sol', './contracts/ignored_contracts/AraToken.sol' ],
  ZERO_BYTES32: '0x00000000000000000000000000000000',
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  BYTESDIR: path.resolve(__dirname, './bytecode')
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
    address = local
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
