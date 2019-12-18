## [0.25.5](https://github.com/AraBlocks/ara-contracts/compare/0.20.0...0.25.5) (2019-12-17)


### Bug Fixes

* add back farmer deposit case ([2800d7f](https://github.com/AraBlocks/ara-contracts/commit/2800d7f885526983262311cb20213c24c646e24d))
* add back InsufficientBudget event ([e63b51e](https://github.com/AraBlocks/ara-contracts/commit/e63b51e1d0994b90831599898c218cb5f50d20c9))
* ensure event listeners resolve the correct event ([9ba73a1](https://github.com/AraBlocks/ara-contracts/commit/9ba73a13f4e87fdfb80009d1cb61118112b63b7a))
* error handling ([22f6734](https://github.com/AraBlocks/ara-contracts/commit/22f67347cc40054c3e7e8c14ba8d228862f686e1))
* fixed AFSestimate contract name, deployed standard 3 ([e6db15a](https://github.com/AraBlocks/ara-contracts/commit/e6db15a0568f645c73182272aeab85e57b31131d))
* forgot to deploy bytecode ([ffe7ddd](https://github.com/AraBlocks/ara-contracts/commit/ffe7dddcaf788c3ca90b4f3ec353884d53782d1d))
* improve allocateRewards ([abe78bb](https://github.com/AraBlocks/ara-contracts/commit/abe78bb8d64ec4e69fa0a11e3048fe9e31d593cc))
* lint ([059cda7](https://github.com/AraBlocks/ara-contracts/commit/059cda76b9916a221adb9ef7ec9b039669881db6))
* lint ([952c8fe](https://github.com/AraBlocks/ara-contracts/commit/952c8fe68c733d89022ac61896e2e5c1c49efb78))
* lint ([7924e02](https://github.com/AraBlocks/ara-contracts/commit/7924e0249e1dcb614daa1852ad4d9a7bd89108ff))
* **): lint; add(:** standard estimate proxy did ([8fc0f29](https://github.com/AraBlocks/ara-contracts/commit/8fc0f29c51d350af6edc33a7d57cc3dfb3e8b3a8))
* removed modifiers from AFSestimate, deployed standard 4 ([78278b3](https://github.com/AraBlocks/ara-contracts/commit/78278b37f24544788fb171cb3e78c4551c7946ec))
* support mainnet standard version ([e448275](https://github.com/AraBlocks/ara-contracts/commit/e4482759c2780dae96f1e02d51a1caa61a7b345b))
* tests ([5b6aee6](https://github.com/AraBlocks/ara-contracts/commit/5b6aee6f6d1976e9a6b9303f2c6519dc263c0ca5))
* typo ([4c621a3](https://github.com/AraBlocks/ara-contracts/commit/4c621a3f929e1eeece36bafd58c495fe210b4e11))
* undo something ([85f265e](https://github.com/AraBlocks/ara-contracts/commit/85f265e0e6be828564ae43ced85b50c0e1b6771f))
* use safemath ([c2bbaa4](https://github.com/AraBlocks/ara-contracts/commit/c2bbaa4a0eedce2059e8a29593efd39beec45ce9))
* wording ([6420a0f](https://github.com/AraBlocks/ara-contracts/commit/6420a0fbbcf6163bc479d2c09969869b841c6419))


### Features

* allow token transfer and balance with Etheruem address ([764674e](https://github.com/AraBlocks/ara-contracts/commit/764674e98eab97801504228990ec8852554293be))
* consolidate proxy usage to AraProxy ([f0da598](https://github.com/AraBlocks/ara-contracts/commit/f0da5986c7262dc5cd8a1e77f1639566c4511b8f))
* dynamically determine standard compile label ([1ca775c](https://github.com/AraBlocks/ara-contracts/commit/1ca775c7772ce18171a7668cb755c3f760e40842))
* mainnet deploy ([7a7402b](https://github.com/AraBlocks/ara-contracts/commit/7a7402bebd43f62b23ea2c810b7f591c48355388))
* pass thru gas price ([5258305](https://github.com/AraBlocks/ara-contracts/commit/5258305bf1ddb6e25126298e5c0224e3fa2a23c3))
* refactor out AraRegistry dependency in AraProxy ([4c3cdfa](https://github.com/AraBlocks/ara-contracts/commit/4c3cdfabee657b216bc920a5aef74a45b27d2e67))
* support estimate standard ([e0e4ce4](https://github.com/AraBlocks/ara-contracts/commit/e0e4ce4b56dff9274dd87a974d464db9b1a13387))
* support tx cbs ([a28fdc5](https://github.com/AraBlocks/ara-contracts/commit/a28fdc55825c8a48b56e13e29d4bfb059a6bd2de))
* update Library contract to use uint32, redeploy to privatenet ([6321541](https://github.com/AraBlocks/ara-contracts/commit/6321541a5c38e873f320b10324e1e6c620e2c585))



# [0.20.0](https://github.com/AraBlocks/ara-contracts/compare/0.16.0...0.20.0) (2019-01-16)


### Bug Fixes

* 0x prefix ([cba1437](https://github.com/AraBlocks/ara-contracts/commit/cba14378c36d6a4c187c7b7e68862d47219ec76e))
* actually silence ganache... ([4595541](https://github.com/AraBlocks/ara-contracts/commit/45955419ab4d1622012ad4737ea13f5687bbb304))
* add mods to AraRegistry ([bcedd09](https://github.com/AraBlocks/ara-contracts/commit/bcedd09e77e7845cc15388701c7e652edc7248e5))
* added quiet mode ganache ([525b781](https://github.com/AraBlocks/ara-contracts/commit/525b7817d95a8c68350074a683e031680162b993))
* AraProxy (i think?) ([2d29208](https://github.com/AraBlocks/ara-contracts/commit/2d292085c618a191dd9c0ff99de253f90fec6f91))
* attempting disabling quiet mode ([e1106df](https://github.com/AraBlocks/ara-contracts/commit/e1106dfdedc680cf3235b93cef13edecdfdb6d09))
* bytesdir ([c93365c](https://github.com/AraBlocks/ara-contracts/commit/c93365cd3dca951fc16f77264a78cec7b2730ff9))
* can upgrade all contracts at once ([6cf49bb](https://github.com/AraBlocks/ara-contracts/commit/6cf49bb91c75f6a6ac49673a49d94da3b168a2e7))
* cant silence ganache... ([8f1b5e5](https://github.com/AraBlocks/ara-contracts/commit/8f1b5e590f0dc545ed3fff891b1e73b9014aadba))
* cli arg description ([0c78f6f](https://github.com/AraBlocks/ara-contracts/commit/0c78f6f5744880dac8565a685ec00b6b39c48c28))
* cli updates ([67a82e9](https://github.com/AraBlocks/ara-contracts/commit/67a82e989926a94bc4b1008bd344803a2bca2682))
* convert test AFS owner to new privatenet account ([a1513a3](https://github.com/AraBlocks/ara-contracts/commit/a1513a386507f6843f990115210b6d760f758bb5))
* deploy proxy password bug ([8a89340](https://github.com/AraBlocks/ara-contracts/commit/8a893407eafd13c467de92e54fb91ce610f821b1))
* ethify ([d9b22fe](https://github.com/AraBlocks/ara-contracts/commit/d9b22fea0f6fa7e721d61b0b8ef42c7058b83067))
* forgot a conflicts ([304cfd2](https://github.com/AraBlocks/ara-contracts/commit/304cfd2e0ffc3402f95af488d1421c816ff63248))
* forgot pk in constants, added new fixture ([c2de479](https://github.com/AraBlocks/ara-contracts/commit/c2de4798fc527d2bb785aeff1ef03fd66775cae4))
* lint ([3a60e5a](https://github.com/AraBlocks/ara-contracts/commit/3a60e5af78ddae51e7302b7ed00399c64ace6f38))
* lint ([877af7c](https://github.com/AraBlocks/ara-contracts/commit/877af7c34e6456035a6f856f6e2413bc694d8710))
* lint ([f679e80](https://github.com/AraBlocks/ara-contracts/commit/f679e80956a0a37f57dfd9944cb0c620ddad9800))
* lint ([d06602f](https://github.com/AraBlocks/ara-contracts/commit/d06602fdd1a0e9403626f52dd93c04f08b7a053a))
* more password bug fixes ([cf1cbcc](https://github.com/AraBlocks/ara-contracts/commit/cf1cbcc559637c1569e80a3cdbb5464fd1a28511))
* or not... ([a31a27a](https://github.com/AraBlocks/ara-contracts/commit/a31a27a54b35703e88a0cefb377e2d33ae411b14))
* PR comments, cleanup tests ([c5aa884](https://github.com/AraBlocks/ara-contracts/commit/c5aa884916f94938ab493391a6a286c78e2852df))
* remove spaces ([7e29cab](https://github.com/AraBlocks/ara-contracts/commit/7e29cab1a2f65859a46a8ed09e1cc15448715d26))
* revert ([94348aa](https://github.com/AraBlocks/ara-contracts/commit/94348aa67b920d6651bbdc44e7d0bf8f4cd4f238))
* revert abis ([db0b9aa](https://github.com/AraBlocks/ara-contracts/commit/db0b9aaf9e9ecded19c10aea83c7be48aa73f21c))
* update privatenet deploy account to accomodate mnemonic seed change ([70f055f](https://github.com/AraBlocks/ara-contracts/commit/70f055f471c9ff0be28a3ee20e7b98e1cb40ee72))
* updated test constants ([a6955c3](https://github.com/AraBlocks/ara-contracts/commit/a6955c3eee85e43555e6c106e6e7b280f24c50e8))
* upgrades should be working, more testing needed ([c8cd57e](https://github.com/AraBlocks/ara-contracts/commit/c8cd57ec92586fb58312c14acc09c25cb957dde0))
* use AraProxy instead of Proxy ([e45196f](https://github.com/AraBlocks/ara-contracts/commit/e45196f055340748e0143543b499627dd4d5b4a0))
* without toHexString ([c76a4fe](https://github.com/AraBlocks/ara-contracts/commit/c76a4fed0488f46fea08c19105f95e8154389ea5))
* woops ([6dee7a0](https://github.com/AraBlocks/ara-contracts/commit/6dee7a05880fb6aadf40ca7a86572877dc011425))


### Features

* add calls to factory and more tests ([7f6fb0c](https://github.com/AraBlocks/ara-contracts/commit/7f6fb0c57ead2bbbdaec2c48d8c4b8845b8f40cd))
* add events ([507d7fa](https://github.com/AraBlocks/ara-contracts/commit/507d7fa993e7b987665f98da4dea4350f5baf9f0))
* API WIP ([fa22234](https://github.com/AraBlocks/ara-contracts/commit/fa222345ca0140ae03029d05d0c7fc52e0f9eb0d))
* just a start ([ff758cf](https://github.com/AraBlocks/ara-contracts/commit/ff758cf3f124e6bfa5531864288193d8be2de05e))
* progress, need to fix AraProxy ([cf28b05](https://github.com/AraBlocks/ara-contracts/commit/cf28b05a19211bc35baf8a998c72b3de31ffae90))
* update deploy cli to replace version ([84c9069](https://github.com/AraBlocks/ara-contracts/commit/84c9069e3501725d13198ecfbfecb3e824e817ba))
* upgrade api update ([a994bc8](https://github.com/AraBlocks/ara-contracts/commit/a994bc8dd6e589260dd3f7d13da82e1ddc16bd98))
* upgrade progress ([fbc48f5](https://github.com/AraBlocks/ara-contracts/commit/fbc48f5fd2ddfa505ad6c5c766ad42e8d91a1ba8))
* use compiled bytecode when deploying AFS standard if available ([90a18a5](https://github.com/AraBlocks/ara-contracts/commit/90a18a5619e0fa24d07c75126bf5dfdfab8243b4))



# [0.16.0](https://github.com/AraBlocks/ara-contracts/compare/0.3.0...0.16.0) (2018-12-19)


### Bug Fixes

* 134 ([941d25e](https://github.com/AraBlocks/ara-contracts/commit/941d25e8ca7a9465fc0ac89c19a5647af9426db4))
* add help(false) back ([2fa8a34](https://github.com/AraBlocks/ara-contracts/commit/2fa8a34842007df2cb922d82a045d65e5ace54ee))
* add jobID tohex ([f9ec4e2](https://github.com/AraBlocks/ara-contracts/commit/f9ec4e2e2d313d802bbcd855c3b9557f284c8a61))
* add return value to README ([e106b79](https://github.com/AraBlocks/ara-contracts/commit/e106b793bfa82498ede42985eaa7c72a37564cb4))
* add version aliases ([74814a0](https://github.com/AraBlocks/ara-contracts/commit/74814a077c6c7730fd1c8b4442d3e55886ec045c))
* address PR comments ([5505832](https://github.com/AraBlocks/ara-contracts/commit/5505832e57b8d3f792fcfc35d483d3c4deac10e1))
* check the correct value ([c6a42d9](https://github.com/AraBlocks/ara-contracts/commit/c6a42d9e98401ab80df6d70ce3191850fc7740de))
* constants ([a26bed8](https://github.com/AraBlocks/ara-contracts/commit/a26bed8d25836ff3bff60a48532a2e0afa1ea8d8))
* **.npmignore:** revert bin/ and lib/ in npmignore ([392288e](https://github.com/AraBlocks/ara-contracts/commit/392288e8c93067e4e95b54b166e519d1ec97de96))
* deploy standard during migration ([acefd34](https://github.com/AraBlocks/ara-contracts/commit/acefd342401ac114f28867ba0c0b4d5d6865ef88))
* increase timeout ([b09e898](https://github.com/AraBlocks/ara-contracts/commit/b09e898e8867da7665e9529664520418b78fcdca))
* issue [#85](https://github.com/AraBlocks/ara-contracts/issues/85) ([614ec5d](https://github.com/AraBlocks/ara-contracts/commit/614ec5d7ee1293b95f498e054396cc0bb0c49e68))
* **.npmignore:** revert migrations, installed_contracts in ignore ([d5aef2d](https://github.com/AraBlocks/ara-contracts/commit/d5aef2da27e5023cf58f150f4d02564947fc4f52))
* **build/*:** revert ABIs ([840cf83](https://github.com/AraBlocks/ara-contracts/commit/840cf83f54213a3a47fbb8a37cb6a927e8b445f2))
* **constants.js:** lint it up ([c061587](https://github.com/AraBlocks/ara-contracts/commit/c061587f9dae3a1ae1b1f9948a7f6f8d817a5a11))
* **constants.js:** remove chainIds from address switch ([1a44cc3](https://github.com/AraBlocks/ara-contracts/commit/1a44cc3a2d757f29c3fc94eeb50d6acf66d2bc8e))
* **constants.js:** revert privatenet addresses ([8e9ff24](https://github.com/AraBlocks/ara-contracts/commit/8e9ff24cb199c6210d15434eeecda06376fb917f))
* **migrations/2_deploy_contracts.js:** allow local truffle deployments ([0835298](https://github.com/AraBlocks/ara-contracts/commit/08352986fdc006f7d5f82a10f0cd9bb0fe11eba0))
* **migrations/2_deploy_contracts.js:** fix undefined ctx in deploy ([13378e1](https://github.com/AraBlocks/ara-contracts/commit/13378e1f52a54973418cfb6f21d2c5a49e00e57d))
* **purchase.js:** accounted for budget == 0 for estimate ([#159](https://github.com/AraBlocks/ara-contracts/issues/159)) ([69dcf12](https://github.com/AraBlocks/ara-contracts/commit/69dcf12dd32aec461d3556492b9a1baf89ef6db0))
* **scripts/test:** downgrade solc compiler for truffle ([fc762f0](https://github.com/AraBlocks/ara-contracts/commit/fc762f0dea6ceec3f99a343881817231bc803dce))
* library tests ([7e20d63](https://github.com/AraBlocks/ara-contracts/commit/7e20d63ab996047a6e278665adfdce8df5be1594))
* lint ([e4eceec](https://github.com/AraBlocks/ara-contracts/commit/e4eceec47cfa393c9ee0d66c1ca675777e167f7e))
* lint ([95e9c7d](https://github.com/AraBlocks/ara-contracts/commit/95e9c7d4de8946625f219d033fafc15a07fd6547))
* lint ([7d90f9e](https://github.com/AraBlocks/ara-contracts/commit/7d90f9e627c01fae810b0a306c11c5c9374458f8))
* lint ([c52b6ba](https://github.com/AraBlocks/ara-contracts/commit/c52b6bae9f731737ba22f94b51a376bcb4237369))
* lint ([7f9396c](https://github.com/AraBlocks/ara-contracts/commit/7f9396c53a3d8105aa8265132fd5e7855b9f19b3))
* lint ([bff4ded](https://github.com/AraBlocks/ara-contracts/commit/bff4ded15971fd591c5fb78e4dec1b994c63177c))
* lint ([0a5ff7d](https://github.com/AraBlocks/ara-contracts/commit/0a5ff7df7bbdcc1943134af18aef5a9c88e83779))
* lint ([08646ab](https://github.com/AraBlocks/ara-contracts/commit/08646ab82ce175cf071d9d8e88567e7566e99ceb))
* lint ([4cdc00e](https://github.com/AraBlocks/ara-contracts/commit/4cdc00e97082298fad2d016b222f4d1cfaacd438))
* lint ([daf3f9d](https://github.com/AraBlocks/ara-contracts/commit/daf3f9dd8267216d11d0608f309ed92c3527e25b))
* lint ([94c0977](https://github.com/AraBlocks/ara-contracts/commit/94c09770507942bca44f632da4e21b35f5a00589))
* local network support in constants ([a4b8f19](https://github.com/AraBlocks/ara-contracts/commit/a4b8f19db78a4a12b3ac817593c445711754dcf4))
* missed a variable ([33e4dac](https://github.com/AraBlocks/ara-contracts/commit/33e4dacff3673a42775cfb979feeb703558c77b7))
* missed a word ([f1bd021](https://github.com/AraBlocks/ara-contracts/commit/f1bd021bfba3f414159ba10334e55bfa71905204))
* pass in owner still for allowance, bump ara-identity to 0.30.x ([b152283](https://github.com/AraBlocks/ara-contracts/commit/b152283b699d9d52dfb7001ff944b559ab7d6208))
* remove async in promise ([733d17f](https://github.com/AraBlocks/ara-contracts/commit/733d17ff854f02bbb4748b30714d2b83dda15e7a))
* remove logs ([f23c4ed](https://github.com/AraBlocks/ara-contracts/commit/f23c4ed814855fa021088457a12d3bad50f88ec0))
* remove owner being passed into ara-util.validate ([7cd9aad](https://github.com/AraBlocks/ara-contracts/commit/7cd9aad81ea1e567475d760f480cc3a38e5df423))
* remove unused verbose option ([584261f](https://github.com/AraBlocks/ara-contracts/commit/584261f94afa1852794ea25b02ea2910d0fcc144))
* revert contracts/ ignore, ara-identity 0.34.x => 0.37.x ([73317cb](https://github.com/AraBlocks/ara-contracts/commit/73317cb911cdf0257f511710c0713a320079e58c))
* rewards test ([4edec35](https://github.com/AraBlocks/ara-contracts/commit/4edec35774640edf02458de0ec4a5ee314f6fea8))
* should fix travis ([68b67fc](https://github.com/AraBlocks/ara-contracts/commit/68b67fc86040cecd0a0adff6d372d2fc0fa42d9d))
* test order ([19c5d78](https://github.com/AraBlocks/ara-contracts/commit/19c5d78a5b090f0eac3306ead47998bcf50adaf8))
* test script ([7868e36](https://github.com/AraBlocks/ara-contracts/commit/7868e36b37854f048ffcd8ceff221bd59b614abf))
* tests ([387ac8c](https://github.com/AraBlocks/ara-contracts/commit/387ac8c8d1a5d85adacaf4cc342299729ef8188a))
* **storage.js:** remove comment ([7302568](https://github.com/AraBlocks/ara-contracts/commit/730256835806b85f77edbb544045d902014acf33))
* **storage.js:** remove storage falsy checks ([8bd3ced](https://github.com/AraBlocks/ara-contracts/commit/8bd3cedbdba242133140b3d65c680627caf01920))
* **test/token.js:** remove duplicate test ([9b041da](https://github.com/AraBlocks/ara-contracts/commit/9b041da0d1dd34d1b7bd5b6c351ffcdc61148e65))
* travis ([3cfc45b](https://github.com/AraBlocks/ara-contracts/commit/3cfc45b1a2c33bd4102aff1e5230625ff0f6829e))
* travis ([2e20dbb](https://github.com/AraBlocks/ara-contracts/commit/2e20dbbccf6268a64b9114fa7f28d8190cd14dc1))
* travis ([79870a8](https://github.com/AraBlocks/ara-contracts/commit/79870a869c8d0569ff34b87f5509ea045d673f55))
* travis? ([db5a541](https://github.com/AraBlocks/ara-contracts/commit/db5a5417b587fc72bec779fab436cd09d2ae4d3d))
* uncomment non-storage tests ([88d7890](https://github.com/AraBlocks/ara-contracts/commit/88d78906ec1b5451c05ab857a33674e5c374ca23))
* wrap bc events in promises ([510d235](https://github.com/AraBlocks/ara-contracts/commit/510d23501c4aba9eb6c83a6acd2be0b3d585297a))


### Features

* contract event updates and fix [#152](https://github.com/AraBlocks/ara-contracts/issues/152) ([623aab6](https://github.com/AraBlocks/ara-contracts/commit/623aab64f4bdb7357327827bfa4049506441903a))
* contracts storage interface ([123a701](https://github.com/AraBlocks/ara-contracts/commit/123a701c7fbb6e53d3f496619171ef71834cddde))
* fixes [#140](https://github.com/AraBlocks/ara-contracts/issues/140) ([e56b76d](https://github.com/AraBlocks/ara-contracts/commit/e56b76d5274784ec9ac21c0311dddda61161306d))
* getJobOwner ([5b0f8bf](https://github.com/AraBlocks/ara-contracts/commit/5b0f8bf9775c6790f2977e11d41c0f00c35d4934))
* **package.json:** added shipright cmd to version hook ([ca12fd3](https://github.com/AraBlocks/ara-contracts/commit/ca12fd35115c4b2b5b17fdc825d3d574ea37e2b4))
* index event parameters ([f5ceec8](https://github.com/AraBlocks/ara-contracts/commit/f5ceec8c9b62f4d39deb76c134c3bf40a1e36656))
* rename commerce to ownership ([b2a60aa](https://github.com/AraBlocks/ara-contracts/commit/b2a60aaa49ca46370590b64131a2fc39638ae1b7))
* show help if command provided is not valid ([c9eea56](https://github.com/AraBlocks/ara-contracts/commit/c9eea56041c2a0c62a589298b2e82d68b0a56812))
* storage isEmpty wip ([04e643a](https://github.com/AraBlocks/ara-contracts/commit/04e643a78852ed094449ea0b0421e179e05adc4a))
* **purchase.js:** Added estimate opt for purchasing ([#154](https://github.com/AraBlocks/ara-contracts/issues/154)) ([cdb511a](https://github.com/AraBlocks/ara-contracts/commit/cdb511a7ac7886aa395be35a1d85baf65fe9fe40))
* **rewards.js:** estimaate option for redeem rewards balance ([63ef04a](https://github.com/AraBlocks/ara-contracts/commit/63ef04a3b80139cba797e648e732732e42d47a53))
* **storage.js:** checking if an AFS has been committed to ([31f7d97](https://github.com/AraBlocks/ara-contracts/commit/31f7d977dc59203b04b62ccfafcddf293385d39e))



# [0.3.0](https://github.com/AraBlocks/ara-contracts/compare/0.2.15...0.3.0) (2018-10-25)


### Features

* enforce deposits ([ea64a01](https://github.com/AraBlocks/ara-contracts/commit/ea64a012201a84d8fd58ddcd571dd2c9b76ec2cf))



## [0.2.15](https://github.com/AraBlocks/ara-contracts/compare/0.2.14...0.2.15) (2018-10-25)



## [0.2.14](https://github.com/AraBlocks/ara-contracts/compare/0.2.13...0.2.14) (2018-10-25)


### Bug Fixes

* check if purchased on rewards allocation ([1ff0b58](https://github.com/AraBlocks/ara-contracts/commit/1ff0b58e2bee0d2e138279a5b914df41cb2a2559))
* ensure purchase prior to submitting budget ([67f5e1f](https://github.com/AraBlocks/ara-contracts/commit/67f5e1f283745992c9374bf19c28bf36a40e754c))
* revert farmerDid to requesterDid for rewards redeem, submit ([24814a9](https://github.com/AraBlocks/ara-contracts/commit/24814a92d33229d2b434724b3fa1c8b4ba1509c3))



## [0.2.13](https://github.com/AraBlocks/ara-contracts/compare/0.2.12...0.2.13) (2018-10-25)


### Features

* estimate deploy and upgrade proxy ([5adeceb](https://github.com/AraBlocks/ara-contracts/commit/5adecebbb05bcbbd502fe97f13a599d37376997b))



## [0.2.12](https://github.com/AraBlocks/ara-contracts/compare/0.2.11...0.2.12) (2018-10-24)


### Features

* **purchase.js:** return jobId from purchase ([d85956b](https://github.com/AraBlocks/ara-contracts/commit/d85956b02009f2e7b93d0af636a581d99cd4a757))



## [0.2.11](https://github.com/AraBlocks/ara-contracts/compare/0.2.6...0.2.11) (2018-10-23)


### Bug Fixes

* **bin/act-library:** add missing onfatal ([cd0688d](https://github.com/AraBlocks/ara-contracts/commit/cd0688dab5f6750032bab9b7c032c337c6b76281))
* **constants.js:** Add network ids to switch ([1a3fa7f](https://github.com/AraBlocks/ara-contracts/commit/1a3fa7f5906dac8b061b62c40e2cccd55645c194))


### Features

* **constants.js:** Create WEB3_NETWORK getter for network_id ([b43e171](https://github.com/AraBlocks/ara-contracts/commit/b43e17107a013aa65bd0a0638d49e90fa3703cff))
* **constants.js:** Switch between network addresses based on rc ([3ff85f5](https://github.com/AraBlocks/ara-contracts/commit/3ff85f5aec1fa430bd2d5b095e0210e46525c525))


### Reverts

* Revert "chore(package.json): ara-context 0.4.x" ([3220c6a](https://github.com/AraBlocks/ara-contracts/commit/3220c6a4c47ee39172ed270caca67cdeee7dda00))



## [0.2.6](https://github.com/AraBlocks/ara-contracts/compare/0.2.5...0.2.6) (2018-10-09)


### Bug Fixes

* password arg bug, finish token tests ([e10ca34](https://github.com/AraBlocks/ara-contracts/commit/e10ca34c68a7b8c22ca826eff5079d181e8c93e3))
* purchase.js uses hasPurchased ([548c402](https://github.com/AraBlocks/ara-contracts/commit/548c402a79dc99cc998c19421426e4d9fb0e55be))
* refactor commerce to remove need for owner DID ([b9cb26a](https://github.com/AraBlocks/ara-contracts/commit/b9cb26a79c3ab58e5d67b27e921b9bedc95cef21))
* wrong pk in constants ([a27a418](https://github.com/AraBlocks/ara-contracts/commit/a27a418455543f80a65843a6888d7e67a156b63a))
* **commerce.js:** fix linter ([ac0c1c9](https://github.com/AraBlocks/ara-contracts/commit/ac0c1c91574fd9cb8f6c7adc4949254d4ef4a13d))
* **commerce.js:** not treat ddo as content for request/revoke ([9cf9e3e](https://github.com/AraBlocks/ara-contracts/commit/9cf9e3e82d755a996f7726e7ae88ac77a8e4eb84))
* **commerce.js:** update address error messages ([4b07e55](https://github.com/AraBlocks/ara-contracts/commit/4b07e55208d66364c8f5d6405b8b01f91c1bc8ef))
* **contracts/Ownable.sol:** remove internal functions ([46d3989](https://github.com/AraBlocks/ara-contracts/commit/46d3989486df2cbce3e1a2b4a1696e7a3c9026a6))
* **library.js:** check proxyExists first, to be deprecated in future PR ([4df3558](https://github.com/AraBlocks/ara-contracts/commit/4df355883b93b19f5e80d57bc6a02c5e4963e938))
* **library.js:** deprecate checkLibrary ([767d487](https://github.com/AraBlocks/ara-contracts/commit/767d4879113d9a91e04cba2a8580f875c7d3cd44))


### Features

* hasNotRequested modifier, minor commerce updates ([25c1150](https://github.com/AraBlocks/ara-contracts/commit/25c11501acc2f300532e3ba0179b593ff615b8a9))
* hasPurchased function ([afe2e0b](https://github.com/AraBlocks/ara-contracts/commit/afe2e0be34ca1d06b68b33f7925bc84c3cbb34e6))
* refactored Ownable to allow for staging transfers ([1110bdd](https://github.com/AraBlocks/ara-contracts/commit/1110bdda142a9c30cd1e7fc75bd3ab49a4a6a0ef))
* refactored Ownable to send ownership requests ([888ae7e](https://github.com/AraBlocks/ara-contracts/commit/888ae7eef5506df2be86bf3e66ad4caa0c762849))
* started contract tests ([bb9665d](https://github.com/AraBlocks/ara-contracts/commit/bb9665d51a1a1e96ddc916853667f2a7a898bf22))
* transfer AFS ownership first pass ([697ccff](https://github.com/AraBlocks/ara-contracts/commit/697ccff293c6c5412639934b9246d47aa2721fee))
* transfer ownership estimate ([57494b1](https://github.com/AraBlocks/ara-contracts/commit/57494b19343b8ca9e079c08fcf248f298c824349))



## [0.2.5](https://github.com/AraBlocks/ara-contracts/compare/0.2.4...0.2.5) (2018-09-21)


### Bug Fixes

* **rewards:** using sha3 of farmer address ([5ee0886](https://github.com/AraBlocks/ara-contracts/commit/5ee08860911503618a49de6819565b7502399f1f))
* cleanup rewards.js ([dc82b14](https://github.com/AraBlocks/ara-contracts/commit/dc82b14d5380b4517502a586e8d71be9e6403af3))
* revert commit refactor ([#55](https://github.com/AraBlocks/ara-contracts/issues/55)) ([96d19a6](https://github.com/AraBlocks/ara-contracts/commit/96d19a619d1d1bd102774a2e88005973dbe7b5a5))



## [0.2.4](https://github.com/AraBlocks/ara-contracts/compare/0.2.3...0.2.4) (2018-09-19)



## [0.2.3](https://github.com/AraBlocks/ara-contracts/compare/0.2.2...0.2.3) (2018-09-19)


### Bug Fixes

* use semver for AFS.sol and Registry.sol to fix solc error ([e3a4300](https://github.com/AraBlocks/ara-contracts/commit/e3a4300d0d376dc391e84ed95d2ccd7a25c12bb3))



## [0.2.2](https://github.com/AraBlocks/ara-contracts/compare/0.2.1...0.2.2) (2018-09-19)


### Bug Fixes

* **various:** fixes [#34](https://github.com/AraBlocks/ara-contracts/issues/34) [#36](https://github.com/AraBlocks/ara-contracts/issues/36) [#37](https://github.com/AraBlocks/ara-contracts/issues/37) [#38](https://github.com/AraBlocks/ara-contracts/issues/38) [#39](https://github.com/AraBlocks/ara-contracts/issues/39) ([5307417](https://github.com/AraBlocks/ara-contracts/commit/5307417d593a0a68cb6f54288509266217cbf89a))



## [0.2.1](https://github.com/AraBlocks/ara-contracts/compare/0.2.0...0.2.1) (2018-09-18)


### Bug Fixes

* another const jobId ([ff5348d](https://github.com/AraBlocks/ara-contracts/commit/ff5348d2978de579ce2cea652967fb170f8dd16b))
* const jobId ([ff2e0e2](https://github.com/AraBlocks/ara-contracts/commit/ff2e0e2a2d34257a93e2d25e4229c896df389fa2))


### Features

* changelog support ([8e56d78](https://github.com/AraBlocks/ara-contracts/commit/8e56d786e8fae7fc0ce3cd1a76bc76c8de1050a6))



# [0.2.0](https://github.com/AraBlocks/ara-contracts/compare/0.1.0...0.2.0) (2018-09-13)


### Bug Fixes

* **rewards.js:** remove old code ([eae7fd1](https://github.com/AraBlocks/ara-contracts/commit/eae7fd19c5155513583d2eacb437082255b75c5a))
* **token.js:** expand to string instead of BN ([c0b7cba](https://github.com/AraBlocks/ara-contracts/commit/c0b7cba10360f5731d8945581847c4d6e2794948))



# [0.1.0](https://github.com/AraBlocks/ara-contracts/compare/213ae898a582970249dc26bc04647f5e9d84b5a7...0.1.0) (2018-09-12)


### Bug Fixes

* add error check to getStandard ([9cef6a5](https://github.com/AraBlocks/ara-contracts/commit/9cef6a5ab13963399d0dd2ef2527cea620ac2f40))
* add index >=0 check and remove unnecessary lib array ([9d6c33f](https://github.com/AraBlocks/ara-contracts/commit/9d6c33f9e5acea39ed8046d7e43d5f15cc64a1e2))
* cli logic ([f686367](https://github.com/AraBlocks/ara-contracts/commit/f6863675eff0b1ba1a9827d9f703b14f410b45bb))
* deprecate approve, use increaseApproval token func instead ([c150ac2](https://github.com/AraBlocks/ara-contracts/commit/c150ac2d84a077a6a25463a3c2b527cf22b01cac))
* do not destructure ara-web3/call ([2f7eac0](https://github.com/AraBlocks/ara-contracts/commit/2f7eac029320aa422ecc80c647bcf664accb62d4))
* do not destructure undefined ([ef52dbf](https://github.com/AraBlocks/ara-contracts/commit/ef52dbfd9d9eef8feb7e86a019e45673d2d89923))
* fix AFS standard and more cli progress ([c263c16](https://github.com/AraBlocks/ara-contracts/commit/c263c169c40db7ccf70fca12c194f75647a3253b))
* fix setting default address ([e2cf648](https://github.com/AraBlocks/ara-contracts/commit/e2cf648cf6bd858163a2233a5f28dc1637e90fac))
* library cli ([2e8a821](https://github.com/AraBlocks/ara-contracts/commit/2e8a82180a3c47402a4ab780553d03b1e1d9eb75))
* lint fixes ([44f3b49](https://github.com/AraBlocks/ara-contracts/commit/44f3b4922375621f010f0d588fd0439ed09cdb50))
* properly convert token values for purchasing, rewards ([673e9ed](https://github.com/AraBlocks/ara-contracts/commit/673e9ed7393fa8d9b5c97755dcdd2694213d8ac4))
* remove budget > 0 dependency for rewards, always convert to BN ([203674a](https://github.com/AraBlocks/ara-contracts/commit/203674a732ec01b25c76048ecfa9538cee8b3f94))
* remove slashes ([4c97c96](https://github.com/AraBlocks/ara-contracts/commit/4c97c9636e717a69d1ee4b7663f5ff5c9b6fd97e))
* remove unecessary default ([188ee2f](https://github.com/AraBlocks/ara-contracts/commit/188ee2fe56d4e25939ff9d5495dc2f08ea4833ea))
* rename Library.json ([ac05e39](https://github.com/AraBlocks/ara-contracts/commit/ac05e391dea8922bb0dbbb7c4091a73030e84e57))
* require fix ([090b4ee](https://github.com/AraBlocks/ara-contracts/commit/090b4ee59afb7d0a9ccfdf7d8ea9a77c02ff5fd1))
* **token.js:** update type checking for val ([f5b4bf5](https://github.com/AraBlocks/ara-contracts/commit/f5b4bf5471633054bb5357b97d3ba979b3843464))
* revert approve function ([42359ef](https://github.com/AraBlocks/ara-contracts/commit/42359efc9f5842a22f23510500079023fccccac7))
* solidity compile error ([2b1ceb1](https://github.com/AraBlocks/ara-contracts/commit/2b1ceb139c7c7c15c8b7fe9cb0e694c359c2a1cf))
* **rewards.js:** remove duplicate expand ([fc73bb3](https://github.com/AraBlocks/ara-contracts/commit/fc73bb3d641169a3fed9e8c2c5a3175e3d16222b))
* switch if to require in library contract ([80ebc4d](https://github.com/AraBlocks/ara-contracts/commit/80ebc4df866feb10d6ae1817ffd467bbeb7ac111))
* **contracts/*:** compile fixes ([a5fc8fc](https://github.com/AraBlocks/ara-contracts/commit/a5fc8fc56f11b4be492f783902f17d97fc3c5abc))
* **contracts/*:** fix typos ([f0d514d](https://github.com/AraBlocks/ara-contracts/commit/f0d514d5552c5cb3df89a198db24ce086977b280))
* **index.js:** add to exports ([d8f59cc](https://github.com/AraBlocks/ara-contracts/commit/d8f59cc55bbaf4098140b024ff3e518ddcab93d3))
* **package.json:** revert package.json ([7d9d43b](https://github.com/AraBlocks/ara-contracts/commit/7d9d43bcc9760ccf482eb5b98a9ea063dbedae33))
* **purchase.js:** remove double tx send ([9d53ad3](https://github.com/AraBlocks/ara-contracts/commit/9d53ad3700310252f1b57859efe0cc3ff47b2a60))
* **README.md:** Add correct link to Travis CI ([5771cca](https://github.com/AraBlocks/ara-contracts/commit/5771cca22bee03553f817af8725cf86411118f98))
* **registry.js:** remove AraToken.sol from compilation ([7d9e9a9](https://github.com/AraBlocks/ara-contracts/commit/7d9e9a91527613d15e89a1b5d1fd10c89e5deb16))
* **Registry.sol:** fix modifier logic ([c8f8417](https://github.com/AraBlocks/ara-contracts/commit/c8f8417550d08fb6f680274af6cb63926933154b))
* **rewards.js:** add budget BN conversion ([96e3a0e](https://github.com/AraBlocks/ara-contracts/commit/96e3a0ed801031627ae45e1436cf10e7477dfe81))
* update compiled contracts to respect new StandardToken ([5e409f7](https://github.com/AraBlocks/ara-contracts/commit/5e409f73b1693fd8b2e150ffe45e2f341ef1463f))
* **rewards.js:** convert budget to BN ([09559a6](https://github.com/AraBlocks/ara-contracts/commit/09559a6392eeee5486eacbe23fa4003211b494c9))
* use string interpolate ([0a98289](https://github.com/AraBlocks/ara-contracts/commit/0a9828980b6a2d83261f6a52f6de847c38b0f936))
* **token.js:** expand for funcs calling contract ([fc43770](https://github.com/AraBlocks/ara-contracts/commit/fc43770e94ead2c86bf03487540f8afe3680590b))
* **token.js:** fix loss of precision for big numbers ([b70f60e](https://github.com/AraBlocks/ara-contracts/commit/b70f60e5c60585999d679b8e4b09b73aa2787ec9))
* **util.js:** specify hex encoding ([5439189](https://github.com/AraBlocks/ara-contracts/commit/5439189a979e03bca98890d2487020bd1c20b219))


### Features

* **contracts/*:** ensure caller of addProxy is owner of proxy ([b3f4b39](https://github.com/AraBlocks/ara-contracts/commit/b3f4b395ba865103c0ac94385a2b5723f3b6c44f))
* **contracts/AFS.sol:** remove need to pass in sizes arr for initial writes ([adfee98](https://github.com/AraBlocks/ara-contracts/commit/adfee98fdd7b0f130eb4548d2a42709225a70ebc))
* start lib cli ([c9c4255](https://github.com/AraBlocks/ara-contracts/commit/c9c425525b63f5f3b53aa0398686c92b39cea702))
* **Library, Purchase:** add library and purchase contracts and deploy script ([213ae89](https://github.com/AraBlocks/ara-contracts/commit/213ae898a582970249dc26bc04647f5e9d84b5a7))
* **migrations/*:** migrate all contracts ([7194584](https://github.com/AraBlocks/ara-contracts/commit/719458494e774e9506a8b3fa4ed7eaf621bfaca2))
* **Proxy.sol:** make Proxy a concrete contract ([7c74a78](https://github.com/AraBlocks/ara-contracts/commit/7c74a78cf9ef98463fec7d19e368afd2ee621a4f))
* **purchase.js:** complete purchase flow .. deploy proxy and add to registry ([355d92d](https://github.com/AraBlocks/ara-contracts/commit/355d92d65d87bd84feef7163b23ae7bdd676fc0f))
* add upgradeProxy function ([3b1ea7d](https://github.com/AraBlocks/ara-contracts/commit/3b1ea7deb4bb4ec12a25c1f3e62344e1db1d2e38))
* **purchase.js:** remove budget being mandatory ([cb6a07d](https://github.com/AraBlocks/ara-contracts/commit/cb6a07deca9746a92e51451304ef465df09a0fb9))
* add addresses to constants ([f64fb62](https://github.com/AraBlocks/ara-contracts/commit/f64fb6272e6d0c43d48dc4d1d3e4d9fb6ff2271d))
* add library and purchase contracts ([be8c6a7](https://github.com/AraBlocks/ara-contracts/commit/be8c6a7bda4c6e86330cd237cc61d975067eb70c))
* add library module ([da0c160](https://github.com/AraBlocks/ara-contracts/commit/da0c160e6a3f23ebdb4ab21429a64fdbaf8363f9))
* add purchase module ([cc698a9](https://github.com/AraBlocks/ara-contracts/commit/cc698a9031da8a9a8a5085e751d0f0789f3bd26b))
* add rc and move stuff around ([8303169](https://github.com/AraBlocks/ara-contracts/commit/8303169bd5e73821c6e7840377a07832540b46ee))
* add require reason messages and better error handling in registry ([67f0c10](https://github.com/AraBlocks/ara-contracts/commit/67f0c10d7b535176db567145e7a6bde27dd34c2f))
* add testnet provider ([34bb143](https://github.com/AraBlocks/ara-contracts/commit/34bb143fa98bc25db3c0a74b0ec1b418047bec34))
* added convenience setup cli cmd ([f741267](https://github.com/AraBlocks/ara-contracts/commit/f741267b947e1dc7440caf993522bc8b6f6c4488))
* allocate rewards working ([b9b5ee6](https://github.com/AraBlocks/ara-contracts/commit/b9b5ee6f705bf0aa8a0ab6baf1de73e57850485c))
* ara token contract wrapper ([a89f92d](https://github.com/AraBlocks/ara-contracts/commit/a89f92d79317dbcf9711f7afbdf1fbad9c67043e))
* basic purchase working ([756cf65](https://github.com/AraBlocks/ara-contracts/commit/756cf65368d8de1abc614e9c4513ef10e58cc4a1))
* bignumber support for token amount conversion ([a066670](https://github.com/AraBlocks/ara-contracts/commit/a0666705ee8da4ef2f4398833f70014a15ee9730))
* can deploy proxies and standards! ([a959f94](https://github.com/AraBlocks/ara-contracts/commit/a959f94b7d7f09e993b34870cabee43655d70726))
* current setup works with remote ([7561688](https://github.com/AraBlocks/ara-contracts/commit/7561688a376a9d4dd6bc5ceb22ac34313355dbb4))
* deploy new standards and upgrade proxies working ([21691be](https://github.com/AraBlocks/ara-contracts/commit/21691beab86f718ae3579abc5969bf5fe1a7b283))
* deploy standard progress ([626b856](https://github.com/AraBlocks/ara-contracts/commit/626b8563d4ba4334b44796a9d8b782b3a8b851e7))
* deployments working!!! ready for tests and cleanup ([a925bd0](https://github.com/AraBlocks/ara-contracts/commit/a925bd08a9dfd6513dbcb1c36e6bfb863938e0b4))
* **registry.js:** move deployProxy from afs repo to here, lint fixes ([fee218d](https://github.com/AraBlocks/ara-contracts/commit/fee218d77f121f64ba7a117866699222a5065e09))
* forgot one ([863736a](https://github.com/AraBlocks/ara-contracts/commit/863736a07949d508819a32c145f48bf792128a97))
* more rewards progress ([30fa711](https://github.com/AraBlocks/ara-contracts/commit/30fa71146aecbc6d02fd322cdbb4af0bea920fef))
* optimize storage in AFS contract ([e98d5f8](https://github.com/AraBlocks/ara-contracts/commit/e98d5f80e0547454a8b8fc1d5910746fe4aa46ac))
* proxy progress ([68a3c8c](https://github.com/AraBlocks/ara-contracts/commit/68a3c8c4d8297eac99eda3b7c4ddc4536083f4fc))
* proxy testable ([13258ba](https://github.com/AraBlocks/ara-contracts/commit/13258ba6c327239feaeac1191c40ba3283998e36))
* proxyExists ([da3d456](https://github.com/AraBlocks/ara-contracts/commit/da3d456893000951630d4d78741719781e84e49b))
* **registry.js:** add registry module ([b93aea4](https://github.com/AraBlocks/ara-contracts/commit/b93aea4f45691bbe1f8d80bb9f2d21b8fc177fb9))
* purchase updated with jobs and submit job working ([4d92308](https://github.com/AraBlocks/ara-contracts/commit/4d923084c319352609483095dd3debe159058a93))
* purchase working! made all hashed dids unhashed ([28cb7f1](https://github.com/AraBlocks/ara-contracts/commit/28cb7f1c9a840f1f5e96d4c9435bc7e50385bbc6))
* redeem balance ([cbfb7cd](https://github.com/AraBlocks/ara-contracts/commit/cbfb7cda1d6e2d81f9a5f512cedef668dfe0d22a))
* registry and proxy progress ([4863ecd](https://github.com/AraBlocks/ara-contracts/commit/4863ecd202b3de5dc1b6bd0d3f8c9210acce4dc1))
* rewards cli wip ([0edd30d](https://github.com/AraBlocks/ara-contracts/commit/0edd30d72365c97930d63fed466baa02be616804))
* rewards progress ([f1c5eb7](https://github.com/AraBlocks/ara-contracts/commit/f1c5eb7246b720440833bb3532c7705dd3465ae4))
* simplify act setup ([c40e655](https://github.com/AraBlocks/ara-contracts/commit/c40e65541a7cfc65daeee80751f8b64b87e22a21))
* start cli ([f109eba](https://github.com/AraBlocks/ara-contracts/commit/f109eba878e4b5c4d571a4c56f25704f06e98014))
* started registry and proxy work ([ce6993b](https://github.com/AraBlocks/ara-contracts/commit/ce6993bcd6d5e6d087ec5dee8737b9d5cac4680d))
* update to latest StandardToken ERC20 implementation ([8e57ac5](https://github.com/AraBlocks/ara-contracts/commit/8e57ac5df9d56262a9a4f2ff3ecb9eef820d808f))
* use had-did-method module ([df9c7db](https://github.com/AraBlocks/ara-contracts/commit/df9c7db4a8cd19628c6aea648c2f81787400c4d0))
* working with privatenet, and rebase ([8cf5821](https://github.com/AraBlocks/ara-contracts/commit/8cf5821b1b94d99d67df3fc248e328e8ae339339))
* **token.js:** add expandTokenValue to exports to be consumed by ara-filesystem ([d35740f](https://github.com/AraBlocks/ara-contracts/commit/d35740f60c94fe510b58c2c09ece640291faab04))



