import fs from 'fs/promises'
import path from 'path'
import * as YAML from 'yaml'
import { GatewaySync as sync, CosmosDirectory } from '../../../lib/index.js'
import spinner from '../../utils/spinner.js'

export command = 'dump <chain> [filepath]'
export describe = 'Dump OpenAPI documentation of a chain to a file'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'filepath',
      describe: 'Path to the file to dump to'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chainId = sync.getChain(argv.chain).chain_id
  api = await spinner.named 'Fetching OpenAPI', => CosmosDirectory.getOpenAPI(chainId)
  await spinner.named 'Dumping OpenAPI', =>
    filepath = argv.filepath ? "#{chainId}.openapi.yml"
    await fs.mkdir path.dirname(filepath), recursive: true
    await fs.writeFile filepath, YAML.stringify(api), 'utf8'
  process.exit 0
