import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../utils/spinner.js'

export command = 'show <chain> <endpoint>'
export describe = 'Show information on a specific endpoint'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'endpoint',
      describe: 'The endpoint path to show'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  { paths } = await CosmosDirectory.getOpenAPI(chainId)
  
  if argv.endpoint of paths
    console.log YAML.stringify paths[argv.endpoint]
  else
    console.log 'no such endpoint'
  process.exit 0
