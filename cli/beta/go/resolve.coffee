import { resolve, saveResolutions } from '../../../lib/protoreg.js'
import spinner from '../../utils/spinner.js'

export command = "resolve <module>"
export describe = "Resolve a specific Go module to its actual registry."
export builder = (yargs) ->
  yargs
    .positional 'module',
      describe: 'The module to resolve.'
      type: 'string'
    .option 'force',
      alias: 'f'
      describe: 'Force resolving the module even if it is already cached.'
      type: 'boolean'
      default: false
export handler = (argv) ->
  {repo} = await spinner.named 'Resolving module...', ->
    res = await resolve argv.module
    await saveResolutions()
    return res
  console.log repo
  process.exit 0
