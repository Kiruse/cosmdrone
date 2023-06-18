import { toUtf8 } from '@cosmjs/encoding';
import { exec } from 'child_process'
import * as fs from 'fs/promises'
import * as path from 'path';

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
