import * as fs from 'fs/promises'
import * as path from 'path'
import { rimraf } from 'rimraf'
import semver from 'semver'
import { canAccess, exec } from '../utils.js'
import { DEFAULT_REPODIR, VCSBase } from './vcsbase.js'

export class Git extends VCSBase {
  async isInstalled() {
    const [stdout] = await exec('git --version');
    return stdout.startsWith('git version');
  }
  
  async update(url: string) {
    const repopath = this.getRepoPath(url);
    
    if (!await canAccess(repopath)) {
      await fs.mkdir(repopath, { recursive: true });
      await this.clone(url);
    } else {
      await this.fetch(url);
    }
  }
  
  async clone(url: string) {
    if (!url.match(/^[a-zA-Z0-9_-]+:\/\//))
      url = 'https://' + url;
    await exec('git clone', [url, this.getRepoPath(url)]);
  }
  
  async fetch(url: string) {
    await exec('git fetch', [], { cwd: this.getRepoPath(url) });
  }
  
  async checkout(url: string, entity: string) {
    const cwd = this.getRepoPath(url);
    try {
      await exec('git checkout', [entity], {cwd});
    } catch (err: any) {
      if (err) {
        err.repo = path.relative(DEFAULT_REPODIR, cwd);
      }
      throw err;
    }
  }
  
  async delete(url: string) {
    await rimraf(this.getRepoPath(url));
  }
  
  async getTags(url: string) {
    const [stdout] = await exec('git tag', [], { cwd: this.getRepoPath(url) });
    return stdout
      .split('\n')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  
  async getVersionTags(url: string) {
    const tags = await this.getTags(url);
    return tags.filter(tag => tag.startsWith('v') && semver.coerce(tag.slice(1)));
  }
  
  async getLatestVersionTag(url: string) {
    const tags = await this.getVersionTags(url);
    return tags.sort(semver.rcompare)[0] ?? '';
  }
};

export default new Git();
