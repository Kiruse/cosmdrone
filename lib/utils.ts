import { toUtf8 } from '@cosmjs/encoding'
import axios from 'axios'
import { load as cheerio } from 'cheerio'
import { ExecOptions, exec as _exec } from 'child_process'
import * as fs from 'fs/promises'
import { parseDocument } from 'htmlparser2'
import * as os from 'os'
import * as path from 'path'

export const DATADIR = path.join(os.homedir(), '.cosmdrone');

export async function exec(cmd: string, args: string[], opts: ExecOptions & { encoding: 'buffer' }): Promise<[Buffer, Buffer]>;
export async function exec(cmd: string, args?: string[], opts?: ExecOptions): Promise<[string, string]>;
export async function exec(cmd: string, args: string[] = [], opts?: ExecOptions): Promise<[any, any]> {
  return new Promise((resolve, reject) => {
    args = args
      .map(arg => {
        if (arg.match(/^--?[a-zA-Z0-9_-]/))
          return arg;
        return '"' + arg
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"') +
          '"';
      })
    _exec(cmd + ' ' + args.join(' '), opts, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve([stdout, stderr]);
    });
  });
}

export async function canAccess(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
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

/** Find files within the given `dir` that match the given `pred`. Full absolute file paths are
 * tested against the predicate.
 */
export async function findFiles(dir: string, pred: ((file: string) => boolean) | RegExp): Promise<string[]> {
  return (await getFilesRecursively(dir))
    .filter(file => typeof pred === 'function' ? pred(file) : pred.test(file));
}

export async function webscrape(url: string) {
  return cheerio(parseDocument((await axios.get(url)).data));
}

/** Debounce decorator. Currently, debounced function can only be used in fire-and-forget style. */
export function debounce(wait: number) {
  let timeout: NodeJS.Timeout;
  return <T extends (...args: any[]) => any>(func: T) => {
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };
}
