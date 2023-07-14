import { toBech32, toHex } from '@cosmjs/encoding'
import { keccak256, sha256 } from '@cosmjs/crypto'
import { HDKey } from '@scure/bip32'
import * as bip39 from '@scure/bip39'
import { wordlist } from '@scure/bip39/wordlists/english.js'
import elliptic from 'elliptic'
import * as sync from './gateway/sync.js'
import type { Signer } from './types.js'

const { ec } = elliptic;
const curve = new ec('secp256k1');

/** Parameters for a purpose 44' type HDWallet. For other purposes you'll need to implement your own schemas. */
export interface MnemonicWalletParams {
  /** The mnemonic used to generate your keypair. */
  mnemonic: string;
  /** The BIP44 coin type to use. Many Cosmos chains use 118 aka ATOM coin type.
   * 
   * When passed a string, it is interpreted as the chain ID or chain name, and used to pull the
   * slip44 coin type from the `gateway/sync` submodule. If you pass a number, it is used directly.
   */
  slip44: number | string;
  /** The account number to use. Defaults to 0, i.e. the first account. Typically, the account doesn't change, but the `addressIndex` does. */
  account?: number;
  /** Whether to use the change address. This is here only for completion. Cosmos does not use this path component, but you may choose to anyways. */
  change?: boolean;
  /** Address index to use. Defaults to 0. Unlike the `account` key, this key is soft-derived. */
  addressIndex?: number;
  /** The password used in the mnemonic derivation. This is not the same as the app password
   * protecting access to your wallet. Optional.
   */
  password?: string;
}

export class Secp256k1Keypair implements Signer {
  #keypair: elliptic.ec.KeyPair;
  
  constructor(priv: Uint8Array) {
    this.#keypair = curve.keyFromPrivate(priv);
  }
  
  async pub() {
    return new Uint8Array(this.#keypair.getPublic().encodeCompressed());
  }
  
  async address(bech?: string) {
    if (bech) {
      return toBech32(bech, sha256(await this.pub()));
    } else {
      return '0x' + toHex(keccak256(await this.pub())).slice(-40);
    }
  }
  
  async sign(data: Uint8Array): Promise<Uint8Array> {
    throw Error('not yet implemented');
  }
  
  /** Derive a keypair from the given mnemonic, slip44 coin type, and account number. Note that none
   * of this information is retained in the final keypair, so you'll need to keep track of it if you
   * wish to derive multiple keypairs from the same mnemonic.
   * 
   * Note that the `slip44` parameter can be a string, in which case it is interpreted as the chain
   * ID or chain name, and used to pull the slip44 coin type from the `gateway/sync` submodule.
   */
  static async fromMnemonic({ mnemonic, slip44, account, addressIndex, password }: MnemonicWalletParams) {
    if (typeof slip44 === 'string') {
      await sync.init();
      slip44 = sync.getChain(slip44).slip44;
    }
    return await this.derive(mnemonic, `m/44'/${slip44}'/${account ?? 0}'/0/${addressIndex}`, password);
  }
  
  static async derive(mnemonic: string, derivationPath: string, password?: string) {
    const seed = await bip39.mnemonicToSeed(mnemonic, password);
    const hdkey = HDKey.fromMasterSeed(seed).derive(derivationPath);
    if (!hdkey.privateKey) throw Error('failed to derive private key from mnemonic');
    return new Secp256k1Keypair(hdkey.privateKey);
  }
}

/** Generate a new random mnemonic. */
export function generateMnemonic(long = true) {
  return bip39.generateMnemonic(wordlist, long ? 256 : 128);
}
