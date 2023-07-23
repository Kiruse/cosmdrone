import { Git } from '../../../lib/vcs.js'
import spinner from '../../utils/spinner.js'

export command = "checkout <repo> [entity]"
export describe = "Checkout a specific entity from a Git repository."
export builder = (yargs) ->
  yargs
    .positional 'repo',
      describe: 'The Git repository to checkout.'
      type: 'string'
    .positional 'entity',
      describe: 'The entity to checkout.'
      type: 'string'
export handler = (argv) ->
  await spinner.named 'Updating repository', -> Git.update argv.repo
  if argv.entity
    await spinner.named "Checking out #{argv.entity}", -> Git.checkout argv.repo, argv.entity
  process.exit 0
