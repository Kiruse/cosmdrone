import chalk from 'chalk'
import semver from 'semver'
import { ProtoSync } from '../../lib/api.js'
import { GatewaySync as sync } from '../../lib/index.js'
import spinner from '../utils/spinner.js'

export command = 'compile <chain> [chain-version]'
export describe = 'Compile the ProtoBuf files for a chain. Clears the cache first.'
export builder = (yargs) =>
  yargs
    .positional 'chain',
      describe: 'Chain ID or name'
      type: 'string'
    .positional 'chain-version',
      describe: 'Version of the chain to compile. Defaults to latest.'
      type: 'string'
      coerce: semver.coerce
export handler = (argv) =>
  await spinner.named 'Initializing', => sync.init()
  await spinner.named 'Compiling protobuf files...', =>
    proto = await ProtoSync.fromChain(argv.chain, argv.version)
    await proto.clear cache: true
    await proto.sync()
