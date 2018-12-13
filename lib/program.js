const { error } = require('ara-console')
const { basename } = require('path')
const debug = require('debug')('ara-contracts:cli:program')

/*
 * we use this hack to notify child processes that they were invoked
 * from the `act(1)` shell command
 */
const kFromACTParentFlag = 'from-act-parent'

if (process.argv.join('').indexOf(kFromACTParentFlag) > -1) {
  removeACTParentFlagFromArgv(process.argv)
  process.title = `[act/${basename(process.argv[1]).replace('act-', '')}]`
} else {
  process.title = basename(process.argv[1])
}

// this MUST be required after the `process.argv` hax done above
// eslint-disable-next-line import/no-unresolved
const program = require('yargs')

/*
 * We can configure all programs this way
 * and allow the creation of a "new" one through
 * the `createProgram()` function
 */
const { argv } = program
  .help(false)
  .version(false)
  .option('help', {
    describe: 'Show this message',
    alias: 'h',
  })
  .option('debug', {
    alias: 'D',
    describe: "Enable debug output (Sets 'DEBUG+=ara-contracts:*')",
  })
  .option('secret', {
    alias: 's',
    type: 'string',
    describe: 'Shared secret for the keyring'
  })
  .option('network', {
    alias: 'n',
    type: 'string',
    describe: 'Network name of the key for the DID resolver in the keyring'
  })
  .option('keyring', {
    alias: 'k',
    type: 'string',
    describe: 'Path to the keyring'
  })
  .version()

/**
 * Returns a pre configured yargsa program object
 * with defaults and usage.
 *
 * @public
 * @param {Object} opts
 * @param {String} opts.usage
 * @return {Object}
 */
function createProgram({ usage }) {
  return program
    .usage(String(usage).trim())
    .option(kFromACTParentFlag, {
      hidden: true,
    })
}

function removeACTParentFlagFromArgv(args) {
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i]
    if (arg.replace('--', '') == kFromACTParentFlag) {
      args.splice(i, 1)
    }
  }
}

/*
 * handle unhandledRejection errors thrown from async
 * functions or promises
 */
process.on('unhandledRejection', (err) => {
  debug('unhandledRejection:', err.stack)
  error('An unknown error occured: %s', err.message)
})

// handle uncaughtException errors thrown from anywhere
process.on('uncaughtException', (err) => {
  debug('uncaughtException:', err.stack)
  error('An unknown error occured: %s', err.message)
})

module.exports = {
  kFromACTParentFlag,
  createProgram,
  argv,
}
