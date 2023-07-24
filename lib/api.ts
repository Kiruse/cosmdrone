import { exec } from 'child_process'
import * as fs from 'fs/promises'
import { rimraf } from 'rimraf'
import semver, { SemVer } from 'semver'
import type { Chain } from './chain.js'
import * as path from 'path'
import { GatewaySync } from './gateway/index.js'
import { parseGoMod } from './modparse/index.js'
import { task } from './tasks.js'
import { Version } from './types.js'
import { getUrl } from './urllib.js'
import { DATADIR, canAccess, getFilesRecursively } from './utils.js'
import { Git } from './vcs.js'

const APIDIR = path.join(DATADIR, 'chain-source');

export class Api {
  #proto: ProtoSync | undefined;
  
  constructor(public readonly chain: Chain) {}
  
  /** Synchronize the API of the represented chain. This clones its repository and parses .proto
   * files to generate and cache the API.
   */
  async sync(version?: Version) {
    this.#proto
    throw Error('not yet implemented');
  }
  
  get chainId() { return this.chain.chainId }
  get dir() { return path.join(APIDIR, this.chain.name) }
}

export class ProtoSync {
  #cache: any = {};
  #version: string | undefined;
  
  constructor(
    public readonly remoteUrl: string,
    public readonly basedir: string,
  ) {}
  
  static async fromChain(chain: string): Promise<ProtoSync> {
    await task('Sync Gateway data', () => GatewaySync.init());
    chain = GatewaySync.getChain(chain).chain_name;
    
    const basedir = path.join(APIDIR, chain);
    
    const remoteUrls = getUrl(chain, 'codebase') ?? [];
    if (remoteUrls.length > 1) throw Error(`Multiple codebase URLs found for ${chain}.`);
    const remoteUrl = remoteUrls[0] ?? GatewaySync.getChain(chain).codebase.git_repo;
    
    return new ProtoSync(remoteUrl, basedir);
  }
  
  /** Find a published version that satisfies `^version` if specified, otherwise find latest
   * published version, and caches it. Throws if no version is found.
   */
  @task('Finding version $1')
  async findVersion(version?: Version) {
    let ver: string;
    if (version) {
      const versions = await Git.getVersionTags(this.repodir);
      ver = versions.find(v => semver.satisfies(v, '^' + version)) || '';
      if (!ver) throw Error(`No version found for ${this.repodir} that satisfies ${version}.`);
    } else {
      ver = await Git.getLatestVersionTag(this.repodir);
      if (!ver) throw Error(`No version found for ${this.repodir}.`);
    }
    this.#version = ver;
    await Git.checkout(this.repodir, ver);
    return this;
  }
  
  /** Read the cached protobuf definitions, if any. */
  @task('Reading API cache')
  async read() {
    const file = path.join(this.cachedir, `v${this.version}.json`);
    try {
      this.#cache = JSON.parse(await fs.readFile(file, 'utf8'));
      return true;
    } catch {
      return false;
    }
  }
  
  @task('Syncing API')
  async sync(version?: Version) {
    await Git.update(this.remoteUrl);
    await this.findVersion(version); // find in git tags using semver & cache real tag name
    
    // attempt to load from cache first. assume exact version does not change.
    if (await this.read()) return this;
    
    // setup the complete source code including dependencies
    await this.syncDependencies();
    
    // then generate API from source & cache
    await this.generate();
    return this;
  }
  
  @task('Sync dependencies')
  async syncDependencies() {
    const src = await fs.readFile(path.join(this.repodir, 'go.mod'), 'utf8');
    const deps = parseGoMod(src);
    throw Error('not yet implemented')
  }
  
  @task('Generating API')
  async generate() {
    await compile(this.repodir, this.cachedir);
    throw Error('not yet implemented');
  }
  
  async clear({ repo = true, cache = true }: { repo?: boolean, cache?: boolean } = {}) {
    await Promise.all([
      repo  && rimraf(this.repodir),
      cache && rimraf(this.cachedir),
    ]);
    return this;
  }
  
  get repodir() { return path.join(this.basedir, 'repo') }
  get reponame() { return path.basename(this.basedir) }
  get cachedir() { return path.join(this.basedir, 'cache') }
  get version() { return this.#version ?? '' }
}

const compile = (fromDir: string, toDir: string) => new Promise<[string, string]>(async (resolve, reject) => {
  const files = (await getFilesRecursively(fromDir)).filter(f => f.endsWith('.proto'));
  exec(`yarn pbjs -t json -o ${toDir}/api.json ${files.join(' ')}`, async (err, stdout, stderr) => {
    if (err) return reject(err);
    if (!await canAccess(`${toDir}/api.json`))
      return reject(Object.assign(Error("Failed to generate API."), { stdout, stderr }))
    resolve([stdout, stderr]);
  });
});
