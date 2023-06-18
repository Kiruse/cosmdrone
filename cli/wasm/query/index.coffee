import * as raw from './raw.js'

export command = 'query <subcommand>'
export describe = 'Query the state of smart contracts on the blockchain'
export builder = (yargs) =>
  yargs
    .command raw
    .demandCommand 1
export handler = ->
