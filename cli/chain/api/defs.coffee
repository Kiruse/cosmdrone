import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../spinner.js'

export command = 'defs <chain>'
export describe = 'List all (type) definitions of a chain'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  { definitions } = await CosmosDirectory.getOpenAPI(chainId)
  
  defs = Object.keys(definitions).sort()
  if defs.length
    console.log YAML.stringify defs
  else
    console.log 'nothing'
  process.exit 0
