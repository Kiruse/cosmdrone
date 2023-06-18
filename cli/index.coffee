import yargs from 'yargs'
import * as chain from './chain/index.js'
import * as ibc from './ibc/index.js'
import * as wasm from './wasm/index.js'
yargs(process.argv.slice(2))
  .command chain
  # .command ibc
  .command wasm
  .demandCommand 1
  .help 'help', 'KiruCosm Cosmos Blockchain utility tool'
  .alias 'help', 'h'
  .argv
