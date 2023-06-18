import type { RestGateway } from './gateway/index.js';
import * as sync from './gateway/sync.js'
import { Wasm } from './wasm/index.js'

export class Chain {
  readonly wasm = new Wasm(this);
  
  constructor(public rpc: RestGateway, public chainId: string) {}
}

export const chain = (rpc: RestGateway, chainId: string) => new Chain(rpc, chainId);

chain.byName = (rpc: RestGateway, name: string) => chain(rpc, sync.getChainByName(name).foo);
