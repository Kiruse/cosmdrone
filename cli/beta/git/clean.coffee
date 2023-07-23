import { rimraf } from 'rimraf'
import { Git } from '../../../lib/vcs.js'
import spinner from '../../utils/spinner.js'

export command = "clean <repo>"
export describe = "Clean a local copy of the given remote Git repository."
export builder = (yargs) ->
  yargs
    .positional 'repo',
      describe: 'URL of the remote Git repository of which to clean the local copy.'
      type: 'string'
export handler = (argv) ->
  repopath = Git.getRepoPath argv.repo
  await spinner.named "Cleaning repository at #{repopath}", ->
    await rimraf repopath
  process.exit 0
