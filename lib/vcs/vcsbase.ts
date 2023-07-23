import * as path from 'path'
import { DATADIR } from '../utils.js'
import { rimraf } from 'rimraf';

export const DEFAULT_REPODIR = path.join(DATADIR, 'repos');

export abstract class VCSBase {
  REPODIR = DEFAULT_REPODIR;
  
  /** Checks if the corresponding VSC executable is installed in the host system. */
  abstract isInstalled(): Promise<boolean>;
  
  /** Download and/or update the given repository URL. */
  abstract update(url: string): Promise<void>;
  
  /** Delete the local repository corresponding to the given remote. */
  abstract delete(url: string): Promise<void>;
  
  /** Remove the local instance of the repository. */
  async clear(url: string) {
    const repopath = this.getRepoPath(url);
    await rimraf(repopath);
  }
  
  getRepoPath(url: string): string {
    return getRepoPath(this.REPODIR, url);
  }
}

export function getRepoPath(repodir: string, url: string): string {
  let result = url.replace(/^[a-z0-9]+:\/\/|^\/+/, '');
  
  let idx = result.indexOf('.git');
  if (idx >= 0) result = result.slice(0, idx);
  
  idx = result.indexOf('?');
  if (idx >= 0) result = result.slice(0, idx);
  
  if (result.includes(':'))
    throw Error(`Invalid url: ${url}`);
  
  return path.join(repodir, path.normalize(result));
}
