const rc = require('ara-runtime-configuration')
const { resolve } = require('path')
const extend = require('extend')
const os = require('os')

const defaults = () => ({
  proxy: resolve('/contracts', '/Proxy.sol')
})

module.exports = conf => rc(extend(true, {}, defaults(), conf))
