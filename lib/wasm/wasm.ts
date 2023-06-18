import type { Chain } from '../chain.js'
import { Query } from './query.js'

export class Wasm {
  readonly query = new Query(this);
  
  constructor(public readonly chain: Chain) {}
  
  get chainId() { return this.chain.chainId }
  get rpc() { return this.chain.rpc }
}
