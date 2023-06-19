import * as api from './api/index.js'
import * as info from './info.js'

export command = 'chain <subcommand>'
export describe = 'Chain metadata utilities'
export builder = (yargs) =>
  yargs
    .command api
    .command info
    .demandCommand 1
export handler = (argv) =>
