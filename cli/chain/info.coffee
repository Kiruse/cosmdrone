import * as YAML from 'yaml'
import { GatewaySync as sync } from '../../lib/index.js'
import spinner from '../spinner.js'

export command = 'info <chain>'
export describe = 'Show simple chain info such as chain ID & name'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  chain = sync.getChain argv.chain
  console.log YAML.stringify chain
  process.exit 0
