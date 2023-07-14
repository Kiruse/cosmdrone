import * as compile from './compile.js'

export command = 'proto <subcommand>'
export describe = 'Manage local ProtoBuf cache. This relies on the chain\'s repository being well known and at least exposing .proto files.'
export builder = (yargs) =>
  yargs
    .command compile
    .demandCommand 1
