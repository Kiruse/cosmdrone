import * as YAML from 'yaml'
import { chain, CosmosDirectory, GatewaySync } from '../../../lib/index.js'
import spinner from '../../spinner.js'
import { loadAddresses, resolveAddresses } from '../../utils.js'

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
  
  addrs = await loadAddresses()
  contract = addrs[argv.contractAddress] ? argv.contractAddress
  
  data = await spinner.named 'Retrieving...', => rpc.wasm.query.raw(contract, resolveAddresses(argv.keys, addrs))
  console.log YAML.stringify data
  process.exit 0
