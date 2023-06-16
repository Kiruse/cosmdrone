import * as YAML from 'yaml'
import * as info from './info.js'

export command = 'chain <subcommand>'
export describe = 'Chain metadata utilities'
export builder = (yargs) =>
  yargs
    .command info
    .demandCommand 1
export handler = (argv) =>
  
