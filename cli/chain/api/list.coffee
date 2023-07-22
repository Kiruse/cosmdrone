import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../utils/spinner.js'

export command = 'list <chain>'
export describe = 'List all exposed API endpoints of a chain'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  { paths } = await CosmosDirectory.getOpenAPI(chainId)
  console.log YAML.stringify Object.keys(paths).sort()
  process.exit 0
