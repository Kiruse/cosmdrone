import coffeescript from 'coffeescript'
import * as fs from 'fs/promises'
import watch from 'node-watch'
import ora from 'ora'
import * as path from 'path'
import { rimraf } from 'rimraf'
import { fileURLToPath } from 'url'
import yargs from 'yargs'

argv = yargs(process.argv.slice 2)
  .option 'watch',
    alias: 'w'
    type: 'boolean'
    default: false
  .help()
  .alias 'help', 'h'
  .argv

ROOTDIR = path.normalize path.join path.dirname(fileURLToPath import.meta.url), '..'
CLIDIR  = path.join ROOTDIR, 'cli'
DISTDIR = path.join ROOTDIR, 'dist', 'cli'

compile = (filepath) ->
  return unless filepath.endsWith '.coffee'
  
  relative = path.relative CLIDIR, filepath
  spinner = ora("Compiling #{relative}...").start()
  if relative.startsWith '..'
    spinner.fail "File #{filepath} is not in #{CLIDIR}"
    return
  
  source = await fs.readFile filepath, encoding: 'utf8'
  {js, v3SourceMap} = coffeescript.compile source, { bare: true, sourceMap: true }
  
  distpath = path.join DISTDIR, relative.replace(/\.coffee$/, '.js')
  await fs.mkdir path.join(DISTDIR, path.dirname(relative)), recursive: true
  await fs.writeFile distpath, js or '// nothing here yet'
  # await fs.writeFile "#{distpath}.map", v3SourceMap if v3SourceMap
  spinner.succeed "Compiled #{relative}"

generateIndex = (dirpath) ->
  relative = path.relative CLIDIR, dirpath
  spinner = ora if relative then "Generating #{relative}/index.js..." else "Generating cosmdrone.js..."
  if relative.startsWith '..'
    spinner.fail "File #{dirpath} is not in #{CLIDIR}"
    return
  if relative.startsWith 'utils'
    spinner.info "Skipping #{relative}"
    return
  
  dirpath = path.join DISTDIR, relative
  files = (await fs.readdir dirpath, withFileTypes: true)
    .filter (file) => path.basename(file.name, '.js') isnt 'index'
    .filter (file) => file.name.replace(/\.js$/, '') not in ['utils', 'cosmdrone']
  cmds = files.filter (file) => file.isFile() and file.name.endsWith '.js'
    .map (file) => path.basename(file.name, '.js')
  subs = files.filter (file) => file.isDirectory()
    .map (file) => path.basename(file.name)
  describe = try
    describePath = path.join CLIDIR, relative, 'describe.txt'
    await fs.readFile describePath, 'utf8'
  catch then ''
  
  if relative is ''
    await fs.writeFile path.join(dirpath, 'cosmdrone.js'), [
      "import yargs from 'yargs'"
      cmds.map((cmd) => "import * as #{cmd} from './#{cmd}.js'")...
      subs.map((dir) => "import * as #{dir} from './#{dir}/index.js'")...
      "yargs(process.argv.slice(2))"
      "  .command('*', #{JSON.stringify describe})"
      cmds.map((cmd) => "  .command(#{cmd})")...
      subs.map((cmd) => "  .command(#{cmd})")...
      "  .demandCommand(1)"
      "  .help()"
      "  .alias('help', 'h')"
      "  .argv"
    ].join('\n')
  else
    await fs.writeFile path.join(dirpath, 'index.js'), [
      cmds.map((cmd) => "import * as #{cmd} from './#{cmd}.js'")...
      subs.map((dir) => "import * as #{dir} from './#{dir}/index.js'")...
      "export const command = '#{path.basename dirpath} <subcommand>'"
      "export const describe = #{JSON.stringify describe}"
      "export const builder = yargs => yargs"
      cmds.map((cmd) => "  .command(#{cmd})")...
      subs.map((cmd) => "  .command(#{cmd})")...
      "  .demandCommand(1)"
      "export const handler = argv => {}"
    ].join('\n')
  
  spinner.succeed if relative then "Generated #{relative}/index.js" else "Generated cosmdrone.js"

generate = (dirpath) ->
  relative = path.relative CLIDIR, dirpath
  if relative.startsWith '..'
    throw Error "File #{dirpath} is not in #{CLIDIR}"
  
  entries = (await fs.readdir dirpath, withFileTypes: true)
  files = entries.filter (file) => file.isFile()
    .map (file) => path.join dirpath, file.name
  dirs = entries.filter (file) => file.isDirectory()
    .map (file) => path.join dirpath, file.name
  
  await fs.mkdir path.join(DISTDIR, relative), recursive: true
  await Promise.all [
    files.map(compile)...
    dirs.map(generate)...
  ]
  await generateIndex dirpath

update = (filepath) ->
  relative = path.relative CLIDIR, filepath
  return if relative.startsWith '..'
  
  stat = await fs.stat filepath
  if stat.isDirectory()
    await fs.mkdir path.join(DISTDIR, relative), recursive: true
    await generateIndex filepath
  else
    await compile filepath
  await generateIndex path.dirname filepath

remove = (filepath) ->
  relative = path.relative CLIDIR, filepath
  return if relative.startsWith '..'
  
  spinner = ora("Removing #{relative}...").start()
  
  if relative.match /\.coffee$/
    await Promise.all [
      fs.unlink path.join(DISTDIR, relative).replace(/\.coffee$/, '.js')
      fs.unlink path.join(DISTDIR, relative).replace(/\.coffee$/, '.js.map')
    ]
  else
    await rimraf path.join(DISTDIR, relative)
  await generateIndex path.dirname filepath
  
  spinner.succeed "Removed #{relative}"

spinner = ora("Regenerating CLI...").start()
await rimraf DISTDIR
await generate CLIDIR
spinner.succeed "Generated CLI, watching for changes"

if argv.watch
  watch CLIDIR, {
    persistent: true
    recursive: true
  }, (type, filename) =>
    switch type
      when 'remove'
        await remove filename
      when 'update'
        await update filename
