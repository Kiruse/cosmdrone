import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../spinner.js'

export command = 'find <chain> <regex>'
export describe = 'Find API endpoints by RegEx pattern'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'regex',
      describe: 'A RegEx pattern to filter the API'
      type: 'string'
      coerce: (arg) => new RegExp arg
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  { paths } = await CosmosDirectory.getOpenAPI(chainId)
  filtered = Object.keys(paths)
    .filter (path) => argv.regex.test path
    .sort()
  if filtered.length
    console.log YAML.stringify filtered
  else
    console.log 'nothing'
  process.exit 0
