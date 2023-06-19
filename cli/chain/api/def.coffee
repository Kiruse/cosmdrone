import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../spinner.js'

export command = 'def <chain> <definition>'
export describe = 'Show information on a specific OpenAPI definition'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'definition',
      describe: 'The definition to show'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  { definitions } = await CosmosDirectory.getOpenAPI(chainId)
  
  def = definitions[argv.definition]
  if def
    console.log YAML.stringify def
    process.exit 0
  else
    console.log 'no such definition'
    process.exit 1
