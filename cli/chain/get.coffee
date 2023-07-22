import * as YAML from 'yaml'
import { GatewaySync as sync, chain } from '../../lib/index.js'
import spinner from '../utils/spinner.js'

export command = 'get <chain> <path>'
export describe = 'Read from the blockchain at the given path'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'path',
      describe: 'RPC path to read from'
      type: 'string'
    .option 'param',
      alias: 'p'
      describe: 'Query parameters, if any. Must be a multiple of 2, where the first specifies ' +
        'the parameter name and the second its value. Can be specified multiple times.'
      array: true
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  rpc = chain(chainId)
  console.error 'not yet implemented'
  process.exit 1
