import type { BigNumberish } from './types.js'

export class Coin {
  amount: bigint;
  denom: string;
  
  constructor(amount: BigNumberish, denom: string) {
    this.amount = BigInt(amount);
    this.denom = denom;
  }
  
  toDecimal(decimals: BigNumberish) {
    return new DecimalCoin(this, decimals);
  }
  
  toDecimal6 = () => this.toDecimal(6);
  toDecimal18 = () => this.toDecimal(18);
}

export class DecimalCoin {
  decimals: number;
  
  constructor(public coin: Coin, decimals: BigNumberish) {
    this.decimals = Number(decimals);
  }
  
  static make(amount: BigNumberish, denom: string, decimals: BigNumberish) {
    return new DecimalCoin(new Coin(amount, denom), decimals);
  }
  
  get amount() {
    return this.coin.amount / BigInt(10 ** this.decimals);
  }
  set amount(value: BigNumberish) {
    this.coin.amount = BigInt(value) * BigInt(10 ** this.decimals);
  }
  
  get denom() {
    return this.coin.denom;
  }
  set denom(value: string) {
    this.coin.denom = value;
  }
}
