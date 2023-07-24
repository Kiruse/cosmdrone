import * as fs from 'fs/promises'
import * as path from 'path'
import * as YAML from 'yaml'
import { DATADIR, canAccess, debounce, exec, findFiles, webscrape } from './utils.js'
import { Git } from './vcs.js'
import { DEFAULT_REPODIR, getRepoPath } from './vcs/vcsbase.js'
import { parseGoMod } from './modparse/parser.js'

const METAFILE = path.join(DATADIR, 'protoreg.yaml');
const RESFILE  = path.join(DATADIR, 'resolutions.yaml');

type GoModuleMeta = {
  module: string;
  vcs: 'git';
  repo: string;
}

/** Mapping of `${module}@${version}` to protobuf.json filepaths. `false` if no protobuf found at time of crawl. */
let reg: Record<string, string | false> = null as any;
/** Mapping of module resolutions to avoid making future requests. */
let resolutions: Record<string, GoModuleMeta> = null as any;

/** Load the cache registry */
async function init() {
  await Promise.all([
    (async () => {
      if (!!reg) return;
      if (!await canAccess(METAFILE)) {
        reg = {};
        return;
      }
      try {
        reg = YAML.parse(await fs.readFile(METAFILE, 'utf8'));
      } catch (err: any) {
        reg = {};
        console.warn(`Failed to load protobuf registry from ${METAFILE}:`);
        console.warn(err);
      }
    })(),
    (async () => {
      if (!!resolutions) return;
      if (!await canAccess(RESFILE)) {
        resolutions = {};
        return;
      }
      try {
        resolutions = YAML.parse(await fs.readFile(RESFILE, 'utf8'));
      } catch (err: any) {
        resolutions = {};
        console.warn(`Failed to load module resolutions from ${RESFILE}:`);
        console.warn(err);
      }
    })(),
  ]);
}

export async function get(mod: string, version: string) {
  await init();
  
  if (!reg[`${mod}@${version}`]) {
    await resolve(mod);
    await update(mod);
    await compile(mod, version);
    _saveReg(); // debounced
  }
  
  return reg[`${mod}@${version}`];
}

/** Resolve the given module. Generally called internally, but can be called manually with
 * `force = true` to force updating the resolution cache, although this should, realistically, never
 * be necessary.
 */
export async function resolve(mod: string, force = false): Promise<GoModuleMeta> {
  await init();
  mod = normalizeMod(mod);
  
  // we know github URLs are always valid
  if (mod.startsWith('github.com/'))
    return { module: mod, vcs: 'git', repo: `https://${mod}` };
  
  if (!force && mod in resolutions)
    return resolutions[mod];
  
  // resolve module by crawling the go-import meta tag
  // go-get changes most sites' behavior as it indicates being called by the `go get` command
  let $ = await webscrape(`https://${mod}?go-get=1`);
  const $meta = $('meta[name="go-import"]');
  if (!$meta.length)
    throw Error(`Failed to resolve ${mod}`);
  
  // process the go-import meta
  const [mod2, vcs, repo] = $meta.attr('content')!.split(' ');
  if (mod2 !== mod) throw Error('Module mismatch');
  _saveResolutions(); // debounced
  return resolutions[mod] = {
    module: mod,
    vcs: vcs as any,
    repo,
  };
}
function getResolved(mod: string): GoModuleMeta {
  mod = normalizeMod(mod);
  if (mod.startsWith('github.com/')) {
    return {
      module: mod,
      vcs: 'git',
      repo: `https://${mod}`,
    };
  }
  if (!resolutions[mod]) throw Error(`GoMod ${mod} not yet resolved`);
  return resolutions[mod];
}

export async function save() {
  if (!reg || !resolutions) throw Error('ProtoBuf registry not initialized');
  await Promise.all([saveRegistry(), saveResolutions()]);
}

async function saveRegistry() {
  try {
    await fs.writeFile(METAFILE, YAML.stringify(reg));
  } catch (err: any) {
    console.warn(`Failed to save protobuf registry to ${METAFILE}:`);
    console.warn(err);
  }
}
const _saveReg = debounce(300)(saveRegistry);

async function saveResolutions() {
  try {
    await fs.writeFile(RESFILE, YAML.stringify(resolutions));
  } catch (err: any) {
    console.warn(`Failed to save module resolutions to ${RESFILE}:`);
    console.warn(err);
  }
}
const _saveResolutions = debounce(300)(saveResolutions);

async function update(mod: string) {
  const { vcs, repo } = getResolved(mod);
  switch (vcs) {
    case 'git': {
      await Git.update(repo);
      break;
    }
    default: throw Error(`Unsupported VSC type ${vcs as any}`);
  }
}

/** Checkout the given `version` for the repository behind `mod`. Currently only supports Git repos. */
async function checkout(mod: string, version: string) {
  const { repo, vcs } = getResolved(mod);
  if (vcs !== 'git') throw Error(`Unsupported VSC type ${vcs as any}`);
  
  /** Special format for tagging specific commit hashes. */
  const matches = version.match(/^v\d+\.\d+\.\d+-\d+-([a-f0-9]+)$/);
  if (matches) {
    const commit = matches[1];
    await Git.checkout(repo, commit);
  } else {
    await Git.checkout(repo, version);
  }
}

/** Truncate unneeded data on the given module from the protobuf registry. It will need to be
 * re-downloaded when a different version of the module is requested.
 */
export async function truncate(mod: string): Promise<void>;
/** Truncate unneeded data from the protobuf registry, i.e. primarily repositories. They will need
 * to be re-downloaded when a different version of the corresponding module is requested.
 */
export async function truncate(): Promise<void>;
export async function truncate(mod?: string) {
  await init();
  if (!mod) {
    await Promise.all(Object.keys(reg).map(truncate))
  } else {
    const { module, vcs } = await resolve(mod);
    if (vcs !== 'git') throw Error(`Unsupported VSC type ${vcs as any}`);
    if (Object.keys(reg).some(mod => mod.startsWith(`${module}@`))) {
      await Git.delete(mod);
    }
  }
}

async function compile(mod: string, version: string) {
  const {repo} = getResolved(mod);
  const repopath = getRepoPath(DEFAULT_REPODIR, repo);
  
  const files = await findFiles(repopath, /\.proto$/);
  const depsProtos = await getDepsProtos(mod, version);
  
  if (!files.length && !depsProtos.length) {
    reg[`${mod}@${version}`] = false;
  } else {
    const filepath = path.join(DATADIR, 'protoreg', `${mod}`, `${version}.json`);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await exec('pbjs', ['-t json', '-o', filepath, ...files, ...depsProtos]);
    reg[`${mod}@${version}`] = filepath;
  }
}

async function getDepsProtos(mod: string, version: string) {
  const {repo} = getResolved(mod);
  const repopath = getRepoPath(DEFAULT_REPODIR, repo);
  const gomod = await parseGoMod(path.join(repopath, 'go.mod'));
  await checkout(mod, version);
  
  const deps = Object.entries(resolveDeps(gomod));
  return (await Promise.all(deps.map(([,{ module, version }]) => get(module, version))))
    .filter(Boolean) as string[];
}

function resolveDeps(gomod: Awaited<ReturnType<typeof parseGoMod>>) {
  const deps = Object.fromEntries(gomod.requires.map(({ url, version }) => [url, { module: url, version }]));
  for (const { src, dest, version } of gomod.replaces) {
    if (src in deps)
      deps[src] = { module: dest, version };
  }
  return deps;
}

const normalizeMod = (mod: string) => mod.replace(/^[a-zA-Z0-9_-]:\/\//, '');
