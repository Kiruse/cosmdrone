import * as YAML from 'yaml'
import { chain, CosmosDirectory, GatewaySync } from '../../../lib/index.js'
import spinner from '../../spinner.js'

export command = 'raw <chainId> <contractAddress> <keys..>'
export describe = 'Query raw state keys of a smart contract'
export builder = (yargs) =>
  yargs
    .positional 'chainId',
      describe: 'The chain ID of the blockchain'
      type: 'string'
    .positional 'contractAddress',
      describe: 'The address of the smart contract'
      type: 'string'
    .positional 'keys',
      describe: 'The keys to query'
      type: 'array'
export handler = (argv) =>
  await spinner.named 'Initializing Gateway', => GatewaySync.init()
  chainId = GatewaySync.getChain(argv.chainId).chain_id
  rpc = chain(CosmosDirectory, chainId)
  data = await spinner.named 'Retrieving...', => rpc.wasm.query.raw(argv.contractAddress, argv.keys)
  console.log YAML.stringify data
  process.exit 0
