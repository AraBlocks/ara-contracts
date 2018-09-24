
act CLI
===
Command line interface for interacting with act

## CLI

### act(1)

#### Abstract

Command line interface runner for act commands. A act command is any command
found in a user's `PATH` or `PATHEXT` that is excutable and is prefixed with
a `act-` in the name.


#### Usage

```sh
usage: act: [-hDV] [--help] [--version]
[--debug] <command> [<args>]
```

#### Options
| Flag(s) | Description |
|--|--|
|-h, --help|  Show this message|
|-V, --version|  Show ACT CLI version|
|-v, --verbose|  Show verbose output|
|-contracts, -D, --debug|:*')|
|||
------
### act-deploy(1)

#### Abstract

This command will deploy an ara proxy or standard contract

#### Usage

```sh
usage: act deploy: [-h] [--help]
[options] [--] <pathspec>...
```

#### Options
| Flag(s) | Description |
|--|--|
|-h, --help|  Show this message|
|-V, --version|  Show ACT CLI version|
|-v, --verbose|  Show verbose output|
|||
------------
### act-reward(1)

#### Abstract

This command will submit, allocate, and redeem rewards

#### Usage

```sh
usage: act reward: [-h] [--help] [options]
```

#### Options
| Flag(s) | Description |
|--|--|
|-h, --help|  Show this message|
|-V, --version|  Show ACT CLI version|
|-v, --verbose|  Show verbose output|
|||
---
### act-token(1)

#### Abstract

This command will query balances, total supply, allowances, and deposit amounts

#### Usage

```sh
usage: act token: [-h] [--help] [options] [--] <command>
```

#### Options
| Flag(s) | Description |
|--|--|
|-h, --help|  Show this message|
|-V, --version|  Show ACT CLI version|
|-v, --verbose|  Show verbose output|
|||
------
