 ### act(1)

#### Abstract

All other commands prepended with `act-` execute as a child of this command

#### Usage

```sh
usage: act: [-hDV] [--help] [--version]
[--debug] <command> [<args>]
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show this message||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||



---
 ### act-deploy(1)

#### Abstract

Deploy an Ara proxy or standard contract

#### Usage

```sh
usage: act deploy: [-h] [--help]
[options] [--] <pathspec>...
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID of the Ara master account|string|



#### Subcommands
| Subcommand | Description |
|--|--|
|act-deploy proxy|Deploy a proxy contract for <did>|
|act-deploy standard|Deploy a new AFS standard|


 ### act-deploy proxy(1)

#### Abstract

Deploy a proxy contract for <did>

#### Usage

```sh
act-deploy proxy [options] <did> <version-name>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring||
|-v, --version, -V|Show version number||
|-name, -u, --upgrade|[boolean]|>|
|-f, --force|Bypass password input, must also pass in password.||
|-p, --password|Password for DID||
|-a, -password, --afs|Password for AFS||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The content DID for this proxy|string|
|version-name|The version name of the AFS standard to use with this proxy|string required|




 ### act-deploy standard(1)

#### Abstract

Deploy a new AFS standard

#### Usage

```sh
act-deploy standard [options] <did> <version-name> <pathspec...>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||
|-f, --force|Bypass password input, must also pass in password.||
|-p, --password|Password for DID||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The registry contract owner DID|string|
|version-name|The version name of the new AFS standard|string|
|pathspec|Paths to the solidity dependencies(s) of AFS.sol|array required default: |




---
 ### act-library(1)

#### Abstract

Interact with the ARA library

#### Usage

```sh
usage: act library: [-h] [--help]
<did> [options]
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The library owner's DID|string|



#### Subcommands
| Subcommand | Description |
|--|--|
|act-library get|Gets the content DID at <index> in <did>'s|


 ### act-library get(1)

#### Abstract

Gets the content DID at <index> in <did>'s

#### Usage

```sh
act-library get <did> <index>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The library owner's DID|string|
|index|The position in the library|number|




---
 ### act-purchase(1)

#### Abstract

Purchase an AFS in the ARA network

#### Usage

```sh
act-purchase <purchaser> <did> [--budget]
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||
|-b, --budget|The amount of Ara to budget for downloading the AFS[number]||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|purchaser|The DID of the purchaser|string|
|did|The content DID to purchase|string|




---
 ### act-reward(1)

#### Abstract

Submit, allocate, and redeem rewards

#### Usage

```sh
usage: act reward: [-h] [--help] [options]
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Subcommands
| Subcommand | Description |
|--|--|
|act-reward balance|Query <did>'s reward balance for|
|act-reward redeem|Transfer balance from <content> to|
|act-reward submit|Submit a budget for a DCDN download|
|act-reward budget|Query the budget for a <jobId>|
|act-reward allocate|Allocate the budget for <jobId>|


 ### act-reward balance(1)

#### Abstract

Query <did>'s reward balance for

#### Usage

```sh
act-reward balance <did> <content>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID that owns the balance|string|
|content|The content DID where the balance is located|string|




 ### act-reward redeem(1)

#### Abstract

Transfer balance from <content> to

#### Usage

```sh
act-reward redeem <did> <content>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID that owns the balance|string|
|content|The content DID where the balance is located|string|




 ### act-reward submit(1)

#### Abstract

Submit a budget for a DCDN download

#### Usage

```sh
act-reward submit <did> <content> <budget>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID providing the budget|string|
|content|The content DID where the budget will be submitted[string] [required]||
|budget|The amount of Ara to budget for a DCDN download|string|




 ### act-reward budget(1)

#### Abstract

Query the budget for a <jobId>

#### Usage

```sh
act-reward budget <content> <jobId>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|content|The content DID where the budget is located|string|
|jobId|The ID of the DCDN job the budget is for|string|




 ### act-reward allocate(1)

#### Abstract

Allocate the budget for <jobId>

#### Usage

```sh
act-reward allocate <did> <content> <jobId> [--returnBudget]
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring||
|-v, --version, -V|Show version number||
|-r, --returnBudget|Flag to indicate whether the remaining rewards budget||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID allocating the budget|string|
|content|The content DID where the budget is located|string|
|jobId|The ID of the DCDN job the budget is for|string|




---
 ### act-approve(1)

#### Abstract

Approve Ara transfers on a sender's behalf

#### Usage

```sh
act-approve [options] <owner> <spender> <amount>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||
|-i, --increase|Flag to increase approval by <amount>||
|-d, --decrease|Flag to decrease approval by <amount>||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|owner|DID of the owner (the account that owns the tokens to be spent)|string|
|amount|Amount to modify the allowance for <spender>|string|




---
 ### act-transfer(1)

#### Abstract

Transfer Ara to a specified address; can specify from address

#### Usage

```sh
act-transfer [--sender] <from> <to> <amount>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||
|-s, --sender|DID of the sender of the transaction if it is not <from>||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|from|DID of the account to transfer Ara from|string|
|to|DID or address of the account to transfer Ara to|string|
|amount|Number of Ara to transfer|string|




---
 ### act-deposit(1)

#### Abstract

Deposit Ara for rewards eligibility

#### Usage

```sh
act-deposit <did> <amount>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|DID of the requester (the account that owns the tokens to be deposited)|string|




---
 ### act-withdraw(1)

#### Abstract

Withdraw Ara from prior deposit

#### Usage

```sh
act-withdraw <did> <amount>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|DID of the withdrawer|string|
|amount|The number of Ara tokens to withdraw|string|




---
 ### act-token(1)

#### Abstract

Query balances, total supply, allowances, and deposit amounts

#### Usage

```sh
usage: act token: [-h] [--help] [options] [--] <command>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Subcommands
| Subcommand | Description |
|--|--|
|act-token deposited|Query number of Ara currently deposited|
|act-token balance|Query Ara balance of of an Ara identity|
|act-token allowance|Query number of Ara <spender> can spend|
|act-token supply|Query total supply of Ara|


 ### act-token deposited(1)

#### Abstract

Query number of Ara currently deposited

#### Usage

```sh
act-token deposited <did>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|DID of the account to check|string|




 ### act-token balance(1)

#### Abstract

Query Ara balance of of an Ara identity

#### Usage

```sh
act-token balance <account>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|account|DID/Ethereum address of the account to check|string|




 ### act-token allowance(1)

#### Abstract

Query number of Ara <spender> can spend

#### Usage

```sh
act-token allowance <did> <spender>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|DID of the owner|string|
|spender|DID of the spender|string|




 ### act-token supply(1)

#### Abstract

Query total supply of Ara

#### Usage

```sh
act-token supply
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||



---
 ### act-upgrade(1)

#### Abstract

Upgrade an Ara core contract (Registry, Library, Token)

#### Usage

```sh
act-upgrade [options] <did> <version-name>
```

#### Options
| Flag(s) | Description | Type |
|--|--|--|
|-h, --help|Show help||
|-contracts, -D, --debug||:*')|
|-s, --secret|Shared secret for the keyring||
|-n, --network|Network name of the key for the DID resolver in the keyring [string]||
|-v, --version, -V|Show version number||
|-r, --registry|Upgrade Registry contract||
|-l, --library|Upgrade Library contract||
|-t, --token|Upgrade Ara Token contract||


#### Positionals
| Flag(s) | Description | Type |
|--|--|--|
|did|The DID of the Ara master account|string|
|version-name|The version name of the new contract|string|



