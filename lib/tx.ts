import type { Chain } from './chain.js'
import { Coin, Signer } from './types.js';

export interface TxParams {
  msgs: readonly any[];
  fees: Coin[];
  gas?: bigint | number | string;
}

export class Tx {
  #signer: Signer;
  
  constructor(public readonly chain: Chain, signer: Signer) {
    this.#signer = signer;
  }
  
  async broadcast({ msgs, fees, gas }: TxParams) {
    throw Error('not yet implemented')
  }
  
  async simulate({ msgs, fees, gas }: TxParams) {
    throw Error('not yet implemented');
  }
  
  get chainId() { return this.chain.chainId }
}
