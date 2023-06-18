import { fromBase64, fromUtf8, toBase64, toUtf8 } from '@cosmjs/encoding'
import { getJoinedKey } from '../utils.js';
import type { Wasm } from './wasm.js'

export class Query {
  constructor(public readonly wasm: Wasm) {}
  
  async raw(contract: string, keys: string[]) {
    if (!keys.length) throw Error('No keys provided');
    const { chainId } = this;
    const key = getJoinedKey(keys);
    const response = await this.rpc.get<{}, { data: string }>({
      chainId,
      path: `/cosmwasm/wasm/v1/contract/${contract}/raw/${encodeURIComponent(toBase64(key))}`,
      params: {},
    });
    const { data } = response;
    if (data === null) return null;
    
    return JSON.parse(
      fromUtf8(fromBase64(data)),
      (_, value) => {
        if (typeof value === 'string' && value.match(/^\d+$/))
          return BigInt(value);
        return value;
      }
    );
  }
  
  get chainId() { return this.wasm.chainId }
  get rpc() { return this.wasm.rpc }
}
