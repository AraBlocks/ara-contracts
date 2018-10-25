<a name="0.2.16"></a>
## [0.2.16](https://github.com/AraBlocks/ara-contracts/compare/0.2.15...0.2.16) (2018-10-25)



<a name="0.2.15"></a>
## [0.2.15](https://github.com/AraBlocks/ara-contracts/compare/0.2.14...0.2.15) (2018-10-25)



<a name="0.2.14"></a>
## [0.2.14](https://github.com/AraBlocks/ara-contracts/compare/0.2.13...0.2.14) (2018-10-25)


### Bug Fixes

* check if purchased on rewards allocation ([1ff0b58](https://github.com/AraBlocks/ara-contracts/commit/1ff0b58))
* ensure purchase prior to submitting budget ([67f5e1f](https://github.com/AraBlocks/ara-contracts/commit/67f5e1f))
* revert farmerDid to requesterDid for rewards redeem, submit ([24814a9](https://github.com/AraBlocks/ara-contracts/commit/24814a9))



<a name="0.2.13"></a>
## [0.2.13](https://github.com/AraBlocks/ara-contracts/compare/0.2.12...0.2.13) (2018-10-25)


### Features

* estimate deploy and upgrade proxy ([5adeceb](https://github.com/AraBlocks/ara-contracts/commit/5adeceb))



<a name="0.2.12"></a>
## [0.2.12](https://github.com/AraBlocks/ara-contracts/compare/0.2.11...0.2.12) (2018-10-24)


### Features

* **purchase.js:** return jobId from purchase ([d85956b](https://github.com/AraBlocks/ara-contracts/commit/d85956b))



<a name="0.2.11"></a>
## [0.2.11](https://github.com/AraBlocks/ara-contracts/compare/0.2.6...0.2.11) (2018-10-23)


### Bug Fixes

* **bin/act-library:** add missing onfatal ([cd0688d](https://github.com/AraBlocks/ara-contracts/commit/cd0688d))
* **constants.js:** Add network ids to switch ([1a3fa7f](https://github.com/AraBlocks/ara-contracts/commit/1a3fa7f))


### Features

* **constants.js:** Create WEB3_NETWORK getter for network_id ([b43e171](https://github.com/AraBlocks/ara-contracts/commit/b43e171))
* **constants.js:** Switch between network addresses based on rc ([3ff85f5](https://github.com/AraBlocks/ara-contracts/commit/3ff85f5))



<a name="0.2.6"></a>
## [0.2.6](https://github.com/AraBlocks/ara-contracts/compare/0.2.5...0.2.6) (2018-10-09)


### Bug Fixes

* password arg bug, finish token tests ([e10ca34](https://github.com/AraBlocks/ara-contracts/commit/e10ca34))
* purchase.js uses hasPurchased ([548c402](https://github.com/AraBlocks/ara-contracts/commit/548c402))
* refactor commerce to remove need for owner DID ([b9cb26a](https://github.com/AraBlocks/ara-contracts/commit/b9cb26a))
* wrong pk in constants ([a27a418](https://github.com/AraBlocks/ara-contracts/commit/a27a418))
* **commerce.js:** fix linter ([ac0c1c9](https://github.com/AraBlocks/ara-contracts/commit/ac0c1c9))
* **commerce.js:** not treat ddo as content for request/revoke ([9cf9e3e](https://github.com/AraBlocks/ara-contracts/commit/9cf9e3e))
* **commerce.js:** update address error messages ([4b07e55](https://github.com/AraBlocks/ara-contracts/commit/4b07e55))
* **contracts/Ownable.sol:** remove internal functions ([46d3989](https://github.com/AraBlocks/ara-contracts/commit/46d3989))
* **library.js:** check proxyExists first, to be deprecated in future PR ([4df3558](https://github.com/AraBlocks/ara-contracts/commit/4df3558))
* **library.js:** deprecate checkLibrary ([767d487](https://github.com/AraBlocks/ara-contracts/commit/767d487))


### Features

* hasNotRequested modifier, minor commerce updates ([25c1150](https://github.com/AraBlocks/ara-contracts/commit/25c1150))
* hasPurchased function ([afe2e0b](https://github.com/AraBlocks/ara-contracts/commit/afe2e0b))
* refactored Ownable to allow for staging transfers ([1110bdd](https://github.com/AraBlocks/ara-contracts/commit/1110bdd))
* refactored Ownable to send ownership requests ([888ae7e](https://github.com/AraBlocks/ara-contracts/commit/888ae7e))
* started contract tests ([bb9665d](https://github.com/AraBlocks/ara-contracts/commit/bb9665d))
* transfer AFS ownership first pass ([697ccff](https://github.com/AraBlocks/ara-contracts/commit/697ccff))
* transfer ownership estimate ([57494b1](https://github.com/AraBlocks/ara-contracts/commit/57494b1))



<a name="0.2.5"></a>
## [0.2.5](https://github.com/AraBlocks/ara-contracts/compare/0.2.4...0.2.5) (2018-09-21)


### Bug Fixes

* **rewards:** using sha3 of farmer address ([5ee0886](https://github.com/AraBlocks/ara-contracts/commit/5ee0886))
* cleanup rewards.js ([dc82b14](https://github.com/AraBlocks/ara-contracts/commit/dc82b14))
* revert commit refactor ([#55](https://github.com/AraBlocks/ara-contracts/issues/55)) ([96d19a6](https://github.com/AraBlocks/ara-contracts/commit/96d19a6))



<a name="0.2.4"></a>
## [0.2.4](https://github.com/AraBlocks/ara-contracts/compare/0.2.3...0.2.4) (2018-09-19)



<a name="0.2.3"></a>
## [0.2.3](https://github.com/AraBlocks/ara-contracts/compare/0.2.2...0.2.3) (2018-09-19)


### Bug Fixes

* use semver for AFS.sol and Registry.sol to fix solc error ([e3a4300](https://github.com/AraBlocks/ara-contracts/commit/e3a4300))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/AraBlocks/ara-contracts/compare/0.2.1...0.2.2) (2018-09-19)


### Bug Fixes

* **various:** fixes [#34](https://github.com/AraBlocks/ara-contracts/issues/34) [#36](https://github.com/AraBlocks/ara-contracts/issues/36) [#37](https://github.com/AraBlocks/ara-contracts/issues/37) [#38](https://github.com/AraBlocks/ara-contracts/issues/38) [#39](https://github.com/AraBlocks/ara-contracts/issues/39) ([5307417](https://github.com/AraBlocks/ara-contracts/commit/5307417))



<a name="0.2.1"></a>
## [0.2.1](https://github.com/AraBlocks/ara-contracts/compare/0.2.0...0.2.1) (2018-09-18)


### Bug Fixes

* another const jobId ([ff5348d](https://github.com/AraBlocks/ara-contracts/commit/ff5348d))
* const jobId ([ff2e0e2](https://github.com/AraBlocks/ara-contracts/commit/ff2e0e2))


### Features

* changelog support ([8e56d78](https://github.com/AraBlocks/ara-contracts/commit/8e56d78))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/AraBlocks/ara-contracts/compare/0.1.0...0.2.0) (2018-09-13)


### Bug Fixes

* **rewards.js:** remove old code ([eae7fd1](https://github.com/AraBlocks/ara-contracts/commit/eae7fd1))
* **token.js:** expand to string instead of BN ([c0b7cba](https://github.com/AraBlocks/ara-contracts/commit/c0b7cba))



<a name="0.1.0"></a>
# [0.1.0](https://github.com/AraBlocks/ara-contracts/compare/213ae89...0.1.0) (2018-09-12)


### Bug Fixes

* add error check to getStandard ([9cef6a5](https://github.com/AraBlocks/ara-contracts/commit/9cef6a5))
* add index >=0 check and remove unnecessary lib array ([9d6c33f](https://github.com/AraBlocks/ara-contracts/commit/9d6c33f))
* cli logic ([f686367](https://github.com/AraBlocks/ara-contracts/commit/f686367))
* deprecate approve, use increaseApproval token func instead ([c150ac2](https://github.com/AraBlocks/ara-contracts/commit/c150ac2))
* do not destructure ara-web3/call ([2f7eac0](https://github.com/AraBlocks/ara-contracts/commit/2f7eac0))
* do not destructure undefined ([ef52dbf](https://github.com/AraBlocks/ara-contracts/commit/ef52dbf))
* fix AFS standard and more cli progress ([c263c16](https://github.com/AraBlocks/ara-contracts/commit/c263c16))
* fix setting default address ([e2cf648](https://github.com/AraBlocks/ara-contracts/commit/e2cf648))
* library cli ([2e8a821](https://github.com/AraBlocks/ara-contracts/commit/2e8a821))
* lint fixes ([44f3b49](https://github.com/AraBlocks/ara-contracts/commit/44f3b49))
* properly convert token values for purchasing, rewards ([673e9ed](https://github.com/AraBlocks/ara-contracts/commit/673e9ed))
* remove budget > 0 dependency for rewards, always convert to BN ([203674a](https://github.com/AraBlocks/ara-contracts/commit/203674a))
* remove slashes ([4c97c96](https://github.com/AraBlocks/ara-contracts/commit/4c97c96))
* remove unecessary default ([188ee2f](https://github.com/AraBlocks/ara-contracts/commit/188ee2f))
* rename Library.json ([ac05e39](https://github.com/AraBlocks/ara-contracts/commit/ac05e39))
* require fix ([090b4ee](https://github.com/AraBlocks/ara-contracts/commit/090b4ee))
* **token.js:** update type checking for val ([f5b4bf5](https://github.com/AraBlocks/ara-contracts/commit/f5b4bf5))
* revert approve function ([42359ef](https://github.com/AraBlocks/ara-contracts/commit/42359ef))
* solidity compile error ([2b1ceb1](https://github.com/AraBlocks/ara-contracts/commit/2b1ceb1))
* **rewards.js:** remove duplicate expand ([fc73bb3](https://github.com/AraBlocks/ara-contracts/commit/fc73bb3))
* switch if to require in library contract ([80ebc4d](https://github.com/AraBlocks/ara-contracts/commit/80ebc4d))
* **contracts/*:** compile fixes ([a5fc8fc](https://github.com/AraBlocks/ara-contracts/commit/a5fc8fc))
* **contracts/*:** fix typos ([f0d514d](https://github.com/AraBlocks/ara-contracts/commit/f0d514d))
* **index.js:** add to exports ([d8f59cc](https://github.com/AraBlocks/ara-contracts/commit/d8f59cc))
* **package.json:** revert package.json ([7d9d43b](https://github.com/AraBlocks/ara-contracts/commit/7d9d43b))
* **purchase.js:** remove double tx send ([9d53ad3](https://github.com/AraBlocks/ara-contracts/commit/9d53ad3))
* **README.md:** Add correct link to Travis CI ([5771cca](https://github.com/AraBlocks/ara-contracts/commit/5771cca))
* **registry.js:** remove AraToken.sol from compilation ([7d9e9a9](https://github.com/AraBlocks/ara-contracts/commit/7d9e9a9))
* **Registry.sol:** fix modifier logic ([c8f8417](https://github.com/AraBlocks/ara-contracts/commit/c8f8417))
* **rewards.js:** add budget BN conversion ([96e3a0e](https://github.com/AraBlocks/ara-contracts/commit/96e3a0e))
* update compiled contracts to respect new StandardToken ([5e409f7](https://github.com/AraBlocks/ara-contracts/commit/5e409f7))
* **rewards.js:** convert budget to BN ([09559a6](https://github.com/AraBlocks/ara-contracts/commit/09559a6))
* use string interpolate ([0a98289](https://github.com/AraBlocks/ara-contracts/commit/0a98289))
* **token.js:** expand for funcs calling contract ([fc43770](https://github.com/AraBlocks/ara-contracts/commit/fc43770))
* **token.js:** fix loss of precision for big numbers ([b70f60e](https://github.com/AraBlocks/ara-contracts/commit/b70f60e))
* **util.js:** specify hex encoding ([5439189](https://github.com/AraBlocks/ara-contracts/commit/5439189))


### Features

* **contracts/*:** ensure caller of addProxy is owner of proxy ([b3f4b39](https://github.com/AraBlocks/ara-contracts/commit/b3f4b39))
* **contracts/AFS.sol:** remove need to pass in sizes arr for initial writes ([adfee98](https://github.com/AraBlocks/ara-contracts/commit/adfee98))
* start lib cli ([c9c4255](https://github.com/AraBlocks/ara-contracts/commit/c9c4255))
* **Library, Purchase:** add library and purchase contracts and deploy script ([213ae89](https://github.com/AraBlocks/ara-contracts/commit/213ae89))
* **migrations/*:** migrate all contracts ([7194584](https://github.com/AraBlocks/ara-contracts/commit/7194584))
* **Proxy.sol:** make Proxy a concrete contract ([7c74a78](https://github.com/AraBlocks/ara-contracts/commit/7c74a78))
* **purchase.js:** complete purchase flow .. deploy proxy and add to registry ([355d92d](https://github.com/AraBlocks/ara-contracts/commit/355d92d))
* add upgradeProxy function ([3b1ea7d](https://github.com/AraBlocks/ara-contracts/commit/3b1ea7d))
* **purchase.js:** remove budget being mandatory ([cb6a07d](https://github.com/AraBlocks/ara-contracts/commit/cb6a07d))
* add addresses to constants ([f64fb62](https://github.com/AraBlocks/ara-contracts/commit/f64fb62))
* add library and purchase contracts ([be8c6a7](https://github.com/AraBlocks/ara-contracts/commit/be8c6a7))
* add library module ([da0c160](https://github.com/AraBlocks/ara-contracts/commit/da0c160))
* add purchase module ([cc698a9](https://github.com/AraBlocks/ara-contracts/commit/cc698a9))
* add rc and move stuff around ([8303169](https://github.com/AraBlocks/ara-contracts/commit/8303169))
* add require reason messages and better error handling in registry ([67f0c10](https://github.com/AraBlocks/ara-contracts/commit/67f0c10))
* add testnet provider ([34bb143](https://github.com/AraBlocks/ara-contracts/commit/34bb143))
* added convenience setup cli cmd ([f741267](https://github.com/AraBlocks/ara-contracts/commit/f741267))
* allocate rewards working ([b9b5ee6](https://github.com/AraBlocks/ara-contracts/commit/b9b5ee6))
* ara token contract wrapper ([a89f92d](https://github.com/AraBlocks/ara-contracts/commit/a89f92d))
* basic purchase working ([756cf65](https://github.com/AraBlocks/ara-contracts/commit/756cf65))
* bignumber support for token amount conversion ([a066670](https://github.com/AraBlocks/ara-contracts/commit/a066670))
* can deploy proxies and standards! ([a959f94](https://github.com/AraBlocks/ara-contracts/commit/a959f94))
* current setup works with remote ([7561688](https://github.com/AraBlocks/ara-contracts/commit/7561688))
* deploy new standards and upgrade proxies working ([21691be](https://github.com/AraBlocks/ara-contracts/commit/21691be))
* deploy standard progress ([626b856](https://github.com/AraBlocks/ara-contracts/commit/626b856))
* deployments working!!! ready for tests and cleanup ([a925bd0](https://github.com/AraBlocks/ara-contracts/commit/a925bd0))
* **registry.js:** move deployProxy from afs repo to here, lint fixes ([fee218d](https://github.com/AraBlocks/ara-contracts/commit/fee218d))
* forgot one ([863736a](https://github.com/AraBlocks/ara-contracts/commit/863736a))
* more rewards progress ([30fa711](https://github.com/AraBlocks/ara-contracts/commit/30fa711))
* optimize storage in AFS contract ([e98d5f8](https://github.com/AraBlocks/ara-contracts/commit/e98d5f8))
* proxy progress ([68a3c8c](https://github.com/AraBlocks/ara-contracts/commit/68a3c8c))
* proxy testable ([13258ba](https://github.com/AraBlocks/ara-contracts/commit/13258ba))
* proxyExists ([da3d456](https://github.com/AraBlocks/ara-contracts/commit/da3d456))
* **registry.js:** add registry module ([b93aea4](https://github.com/AraBlocks/ara-contracts/commit/b93aea4))
* purchase updated with jobs and submit job working ([4d92308](https://github.com/AraBlocks/ara-contracts/commit/4d92308))
* purchase working! made all hashed dids unhashed ([28cb7f1](https://github.com/AraBlocks/ara-contracts/commit/28cb7f1))
* redeem balance ([cbfb7cd](https://github.com/AraBlocks/ara-contracts/commit/cbfb7cd))
* registry and proxy progress ([4863ecd](https://github.com/AraBlocks/ara-contracts/commit/4863ecd))
* rewards cli wip ([0edd30d](https://github.com/AraBlocks/ara-contracts/commit/0edd30d))
* rewards progress ([f1c5eb7](https://github.com/AraBlocks/ara-contracts/commit/f1c5eb7))
* simplify act setup ([c40e655](https://github.com/AraBlocks/ara-contracts/commit/c40e655))
* start cli ([f109eba](https://github.com/AraBlocks/ara-contracts/commit/f109eba))
* started registry and proxy work ([ce6993b](https://github.com/AraBlocks/ara-contracts/commit/ce6993b))
* update to latest StandardToken ERC20 implementation ([8e57ac5](https://github.com/AraBlocks/ara-contracts/commit/8e57ac5))
* use had-did-method module ([df9c7db](https://github.com/AraBlocks/ara-contracts/commit/df9c7db))
* working with privatenet, and rebase ([8cf5821](https://github.com/AraBlocks/ara-contracts/commit/8cf5821))
* **token.js:** add expandTokenValue to exports to be consumed by ara-filesystem ([d35740f](https://github.com/AraBlocks/ara-contracts/commit/d35740f))



