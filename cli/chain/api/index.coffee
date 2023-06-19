import * as def  from './def.js'
import * as defs from './defs.js'
import * as dump from './dump.js'
import * as find from './find.js'
import * as list from './list.js'
import * as show from './show.js'

export command = 'api <subcommand>'
export describe = 'Query OpenAPI documentation of a chain'
export builder = (yargs) =>
  yargs
    .command def
    .command defs
    .command dump
    .command find
    .command list
    .command show
    .demandCommand 1
export handler = =>
