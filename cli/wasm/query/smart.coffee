import { toBase64, toUtf8 } from '@cosmjs/encoding'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import * as readline from 'readline'
import * as tty from 'tty'
import * as YAML from 'yaml'
import { chain, CosmosDirectory, GatewaySync } from '../../../lib/index.js'
import { replacer } from '../../../lib/serde.js'
import spinner from '../../utils/spinner.js'
import { loadAddresses, parseFields, resolveAddresses, toBinaryFields } from '../../utils/misc.js'

eofstroke = if process.platform is 'win32' then 'Ctrl-Z' else 'Ctrl-D'

export command = 'smart <chain> <contractAddress>'
export describe = "Perform a defined smart query of a smart contract."
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'The chain ID or name of the blockchain'
      type: 'string'
    .positional 'contractAddress',
      describe: 'The address of the smart contract'
      type: 'string'
    .option 'yaml',
      alias: 'y'
      describe: 'Message is in YAML (default is JSON)'
      type: 'boolean'
    .option 'file',
      alias: 'f'
      describe: 'Read message from file'
      conflicts: 'editor'
      coerce: (path) => await fs.readFile path, 'utf8'
    .option 'editor',
      alias: 'e'
      describe: 'Open a specialized CLI text editor for writing the message'
      type: 'boolean'
      conflicts: 'file'
    .option 'binary',
      alias: 'b'
      describe: 'Convert specified fields to binary (base64). Deep fields are specified with dot or bracket notation. Example: --binary foo.bar[bonk.ers][flop].baz'
      array: true
      type: 'string'
      default: []
export handler = (argv) =>
  await spinner.named 'Initializing Gateway', => GatewaySync.init()
  chainId = GatewaySync.getChain(argv.chain).chain_id
  rpc = chain(CosmosDirectory, chainId)
  
  if argv.editor
    unless tty.isatty process.stdout
      console.error "Not an interactive terminal"
      process.exit 1
    console.error "Message Editor not yet implemented"
    process.exit 1
  else if argv.file
    msg = argv.file
  else
    if process.stdin.isTTY
      console.log chalk.blue "Enter message. Press #{chalk.bold(eofstroke)} to finish, #{chalk.bold 'Ctrl-C'} to cancel."
    msg = await readFromStdin()
  
  data = if argv.yaml
    YAML.parse(msg)
  else
    JSON.parse(msg)
  
  addrs = await loadAddresses()
  resolveAddresses data, addrs
  toBinaryFields data, parseFields argv.binary
  contract = addrs[argv.contractAddress] ? argv.contractAddress
  
  response = await spinner.named 'Querying...', => rpc.wasm.query.smart contract, JSON.stringify(data, replacer)
  console.log YAML.stringify response
  process.exit 0

readFromStdin = -> new Promise (resolve, reject) =>
  data = ''
  rl = readline.createInterface process.stdin
  rl.on 'line', (line) =>
    data += line + '\n'
  rl.on 'close', =>
    resolve data
