import * as query from './query/index.js'

export command = 'wasm <subcommand>'
export describe = 'Interact with the CosmWasm module of Cosmos SDK blockchains'
export builder = (yargs) ->
  yargs
    .command query
    .demandCommand 1
export handler = ->
