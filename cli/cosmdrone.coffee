import yargs from 'yargs'
import * as addresses from './addresses.js'
import * as chain from './chain/index.js'
import * as ibc from './ibc/index.js'
import * as wasm from './wasm/index.js'
yargs(process.argv.slice(2))
  .command '*', 'CosmDrone multitool for interfacing with Cosmos SDK blockchains'
  .command addresses
  .command chain
  # .command ibc
  .command wasm
  .demandCommand 1
  .help()
  .alias 'help', 'h'
  .argv
