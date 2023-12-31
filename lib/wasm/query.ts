import { fromBase64, fromUtf8, toBase64, toUtf8 } from '@cosmjs/encoding'
import { reviver } from '../serde.js';
import type { BytesLike } from '../types.js';
import { getJoinedKey } from '../utils.js';
import type { Wasm } from './wasm.js'

export class Query {
  constructor(public readonly wasm: Wasm) {}
  
  async raw(contract: string, keys: string[]) {
    if (!keys.length) throw Error('No keys provided');
    const key = getJoinedKey(keys);
    return await this.chain.get<string>(
      `/cosmwasm/wasm/v1/contract/${contract}/raw/${encodeURIComponent(toBase64(key))}`
    );
  }
  
  async smart(contract: string, query: BytesLike) {
    let queryBytes: string;
    if (typeof query === 'string') {
      queryBytes = toBase64(toUtf8(query));
    } else if (Buffer.isBuffer(query)) {
      queryBytes = query.toString('base64');
    } else {
      queryBytes = toBase64(query);
    }
    
    return await this.chain.get(`/cosmwasm/wasm/v1/contract/${contract}/smart/${queryBytes}`);
  }
  
  get chainId() { return this.wasm.chainId }
  get chain() { return this.wasm.chain }
  get rpc() { return this.wasm.rpc }
}
