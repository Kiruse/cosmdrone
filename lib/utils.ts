import { toUtf8 } from '@cosmjs/encoding'
import { exec } from 'child_process'
import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import semver from 'semver'

export const DATADIR = path.join(os.homedir(), '.cosmdrone');

export async function canAccess(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function hasGit(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    exec('git --version', (err, stdout, stderr) => {
      if (err) return resolve(false);
      resolve(stdout.startsWith('git version'));
    });
  });
}

export async function gitUpdate(url: string, repopath: string): Promise<void> {
  if (!await canAccess(repopath)) {
    await fs.mkdir(repopath, { recursive: true });
    await gitClone(url, repopath);
  } else {
    await gitPull(repopath);
  }
}

export async function gitClone(url: string, repopath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`git clone ${url} ${repopath}`, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function gitPull(repopath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`git pull`, { cwd: repopath }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/** Check something out with git, be it a branch or a tag. */
export async function gitCheckout(repopath: string, gitobj: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`git checkout ${gitobj}`, { cwd: repopath }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve();
    });
  })
}

/** Get all git tags from the given repo. */
export async function getGitTags(repopath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    exec(`git tag`, { cwd: repopath }, (err, stdout, stderr) => {
      if (err) return reject(err);
      const tags = stdout
        .split('\n')
        .map(tag => tag.trim())
        .filter(tag => !!tag);
      resolve(tags);
    });
  });
}

/** Get all git tags that look like a version, i.e. prefixed with 'v' and coercible with semver. */
export async function getGitVersionTags(repopath: string): Promise<string[]> {
  const tags = await getGitTags(repopath);
  return tags.filter(tag => tag.startsWith('v') && semver.coerce(tag.slice(1)));
}

/** Get the git tag with the highest version number. If none, because either versions are tagged
 * with a non-standard name, or because no versions have been tagged, return the empty string.
 */
export async function getLatestGitVersionTag(repopath: string): Promise<string> {
  const tags = await getGitVersionTags(repopath);
  return tags.sort(semver.rcompare)[0] ?? '';
}

export function getJoinedKey(path: string[]): Uint8Array {
  const nsbytes = path.slice(0, -1).map(toUtf8);
  const keybytes = toUtf8(path[path.length-1]);
  
  const buffer = new ArrayBuffer(2*nsbytes.length + nsbytes.reduce((a, b) => a + b.length, 0) + keybytes.length);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  
  let offset = 0;
  for (let i = 0; i < nsbytes.length; ++i) {
    const curr = nsbytes[i];
    view.setUint16(offset, curr.length, false);
    bytes.set(curr, offset + 2);
    offset += 2 + curr.length;
  }
  bytes.set(keybytes, offset);
  
  return bytes;
}

export async function getFilesRecursively(dir: string): Promise<string[]> {
  const result: string[] = [];
  const inner = async (dir: string) => {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        await inner(path.join(dir, file.name));
      } else {
        result.push(path.join(dir, file.name));
      }
    }
  }
  await inner(dir);
  return result;
}
