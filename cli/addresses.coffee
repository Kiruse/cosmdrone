import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as YAML from 'yaml'
import { DATADIR } from '../lib/utils.js'
import { ADDRESSBOOK, loadAddresses as load } from './utils/misc.js'

export command = 'addresses <subcommand>'
export describe = 'Manage addresses for use in the CLI multitool only. When used in messages, addresses must be prefixed with "addr:".'
export builder = (yargs) =>
  yargs
    .command ls 
    .command add 
    .command rm
    .command get
    .command lookup
    .demandCommand 1

ls =
  command: 'ls'
  describe: 'List all registered addresses.'
  builder: (yargs) =>
    yargs
      .option 'names-only',
        alias: 'n'
        describe: 'Only list the names of the addresses.'
        type: 'boolean'
      .option 'json',
        alias: 'j'
        describe: 'Output in JSON format. If --names-only is specified, output is an array of strings, otherwise a key-value map.'
        type: 'boolean'
  handler: (argv) =>
    addresses = await load()
    
    if argv.json
      if argv.namesOnly
        addresses = Object.keys addresses
      console.log JSON.stringify addresses
    else
      if Object.keys(addresses).length
        if argv.namesOnly
          console.log Object.keys(addresses).join ', '
        else
          rows = Object.entries addresses
          maxLength = Math.max ...rows.map ([name]) => name.length
          rows = rows.map ([name, address]) => [name.padEnd(maxLength), address]
          console.log rows.map(([name, address]) => "#{chalk.cyan name}  #{chalk.grey address}").join('\n')
      else
        console.log chalk.grey "No addresses registered."
    process.exit 0

add =
  command: 'add <name> <address>'
  describe: 'Add a new address.'
  builder: (yargs) =>
    yargs
      .option 'force',
        alias: 'f'
        describe: 'Force adding an address that already exists.'
  handler: (argv) ->
    addresses = await load()
    
    if argv.name of addresses and not argv.force
      console.error "Address #{argv.name} (#{addresses[argv.name]}) already exists."
      process.exit 1
    
    pairs = Object.entries addresses
    pairs.push [argv.name, argv.address]
    pairs.sort ([a], [b]) => a.localeCompare b
    await fs.writeFile ADDRESSBOOK, YAML.stringify Object.fromEntries pairs
    console.log "Added #{argv.address} as #{argv.name}."
    process.exit 0

rm =
  command: 'rm <name>'
  describe: 'Remove an address.'
  handler: (argv) ->
    addresses = await load()
    
    unless argv.name of addresses
      delete addresses[argv.name]
      await fs.writeFile ADDRESSBOOK, YAML.stringify addresses
      console.log "Removed #{argv.name}."
    else
      console.log "Address #{argv.name} does not exist."
    
    process.exit 0

get =
  command: 'get <name>'
  describe: 'Get the resolved address of the given alias.'
  handler: (argv) ->
    addresses = await load()
    if argv.name of addresses
      console.log addresses[argv.name]
      process.exit 0
    else
      console.error "Address #{argv.name} does not exist."
      process.exit 1

lookup =
  command: 'lookup <address>'
  describe: 'Search the address book for the given address.'
  handler: (argv) ->
    addresses = await load()
    names = []
    for name, address of addresses
      if address is argv.address
        names.push name
    if names.length
      names = names.map (name) => chalk.cyan name
      console.log "Address #{chalk.grey argv.address} is registered as #{names.join ', '}."
    else
      console.log "Address not found."
    process.exit 0
