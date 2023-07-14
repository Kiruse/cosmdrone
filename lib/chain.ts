import { Api } from './api.js'
import type { DefaultParams, RestGateway } from './gateway/index.js'
import * as sync from './gateway/sync.js'
import { Wasm } from './wasm/index.js'
import { Tx } from './tx.js'
import { Signer } from './types.js'

export class Chain {
  readonly api = new Api(this);
  readonly wasm = new Wasm(this);
  
  constructor(public rpc: RestGateway, public chainId: string) {}
  
  get<R = any>(path: string, params?: DefaultParams): Promise<R>;
  /** Make a generic query on the blockchain. Strictly typed specializations are exposed through
   * the various interfaces of this object.
   */
  get<P = DefaultParams, R = any>(path: string, params: P): Promise<R>;
  get(path: string, params: Record<string, string> = {}) {
    const { chainId } = this;
    return this.rpc.get({
      chainId,
      path,
      params,
    });
  }
  
  /** Create a new TX interface for the given signer/wallet. */
  tx(signer: Signer) {
    return new Tx(this, signer);
  }
  
  get name() {
    return sync.getChain(this.chainId).chain_name;
  }
}

export const chain = (rpc: RestGateway, chain: string) => new Chain(rpc, sync.getChain(chain).chain_id);
