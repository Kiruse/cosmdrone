import * as fs from 'fs/promises'
import { homedir } from 'os'
import { canAccess, gitUpdate } from '../utils.js';

const basedir = `${homedir()}/.kirucosm`;

let initialized = false;
let chainsById: Record<string, any> = {};
let chainsByName: Record<string, any> = {};
let assetlists: Record<string, any> = {}; // only by chainId

export async function init(force = false) {
  if (!force && initialized) return chainsByName;
  initialized = false;
  
  await fs.mkdir(basedir, { recursive: true });
  if (!await canAccess(`${basedir}/chains.json`) || await isOutdated())
    await update();
  populate(await load());
  
  initialized = true;
  return chainsByName;
}

export function getChainById(chainId: string) {
  assertInit();
  return chainsById[chainId];
}

export function getChainByName(chainName: string) {
  assertInit();
  return chainsByName[chainName];
}

export function getAssets(chainId: string) {
  assertInit();
  return assetlists[chainId];
}

async function update() {
  await gitUpdate('https://github.com/cosmos/chain-registry.git', `${basedir}/chain-registry`);
}

async function load() {
  const repopath = `${basedir}/chain-registry`;
  const dirs = (await fs.readdir(repopath, { withFileTypes: true })).filter(dirent => dirent.isDirectory());
  return (await Promise.all(dirs.map(async dirent => {
    const { name } = dirent;
    if (!await canAccess(`${repopath}/${name}/assetlist.json`)) return;
    
    const assetlist = JSON.parse((await fs.readFile(`${repopath}/${name}/assetlist.json`)).toString());
    const chain = JSON.parse((await fs.readFile(`${repopath}/${name}/chain.json`)).toString());
    return { assetlist, chain };
  }))).filter(Boolean) as { chain: any; assetlist: any; }[];
}

function populate(chains: { chain: any; assetlist: any; }[]) {
  chainsById = Object.fromEntries(
    chains.map(data => [data.chain.chain_id, data.chain])
  );
  chainsByName = Object.fromEntries(
    chains.map(data => [data.chain.chain_name, data.chain])
  );
  assetlists = Object.fromEntries(
    chains.map(data => [data.chain.chain_id, data.assetlist])
  );
}

async function isOutdated() {
  const { mtime } = await fs.stat(`${basedir}/chains.json`);
  return Date.now() - mtime.getTime() > 1000 * 60 * 60 * 24;
}

function assertInit() {
  if (!initialized) throw Error('Must first initialize gateway/sync module');
}
