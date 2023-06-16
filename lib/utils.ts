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
