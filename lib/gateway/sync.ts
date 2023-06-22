import * as fs from 'fs/promises'
import { canAccess, DATADIR, gitUpdate } from '../utils.js';

export type ChainInfo =
  & {
      chain_id: string;
      chain_name: string;
      pretty_name: string;
      network_type: 'mainnet' | 'testnet' | 'devnet';
      bech32_prefix: string;
      slip44: number;
      apis: {
        [api_type: string]: {
          address: string;
          provider: string;
        }[];
      };
    }
  & Record<PropertyKey, any>;

let initialized = false;
let chainsById: Record<string, ChainInfo> = {};
let chainsByName: Record<string, ChainInfo> = {};
let assetlists: Record<string, any> = {}; // only by chainId

export async function init(force = false) {
  if (!force && initialized) return chainsByName;
  initialized = false;
  
  await fs.mkdir(DATADIR, { recursive: true });
  if (!await canAccess(`${DATADIR}/chains.json`) || await isOutdated())
    await update();
  populate(await load());
  
  initialized = true;
  return chainsByName;
}

export function getChain(identifier: string) {
  if (identifier in chainsById) return chainsById[identifier];
  if (identifier in chainsByName) return chainsByName[identifier];
  throw Error(`Chain not found: ${identifier}`);
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
  await gitUpdate('https://github.com/cosmos/chain-registry.git', `${DATADIR}/chain-registry`);
}

async function load() {
  const repopath = `${DATADIR}/chain-registry`;
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
  const { mtime } = await fs.stat(`${DATADIR}/chains.json`);
  return Date.now() - mtime.getTime() > 1000 * 60 * 60 * 24;
}

function assertInit() {
  if (!initialized) throw Error('Must first initialize gateway/sync module');
}
