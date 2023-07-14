import type { SemVer } from 'semver'
export * from './types.coin.js'

/** An argument that parses to a SemVer. */
export type Version = string | SemVer;
export type BytesLike = Uint8Array | Buffer | string;
export type BigNumberish = bigint | number | string;

/** Note that OpenAPI IS Swagger, however the Swagger API documentation was donated and then renamed
 * to OpenAPI. Some chains, however, still use the name/prop `swagger` instead of `openapi`, which
 * this type accounts for.
 */
export type ApiType = 'swagger' | 'openapi2' | 'openapi3';

interface OpenAPIInfo {
  title?: string;
  name?: string;
  description?: string;
}

interface OpenAPIPaths {
  [path: string]: {
    [method: string]: {
      summary?: string;
      operationId: string;
      responses: {
        [code: string]: {
          description?: string;
          schema?: any;
        };
      };
      parameters: {
        name: string;
        description?: string;
        in?: string;
        required: boolean;
        type?: string;
        format?: string;
      }[];
      tags?: string[];
    };
  };
}

/** Type schemas referenced by paths above */
type OpenAPISchemas = any;

export type OpenAPI = OpenAPIv2 | OpenAPIv3;

export interface OpenAPIv2 {
  type: 'swagger' | 'openapi2';
  openapi: string;
  info?: OpenAPIInfo;
  paths: OpenAPIPaths;
  definitions?: OpenAPISchemas;
}

export interface OpenAPIv3 {
  type: ApiType;
  openapi: SemVer;
  info?: OpenAPIInfo;
  paths: OpenAPIPaths;
  components?: {
    schemas: OpenAPISchemas;
  };
}

/** Signer really does not give a damn about accounts and mnemonics. */
export interface Signer {
  /** The public key of the represented key pair. */
  pub(): Promise<Uint8Array>;
  /** Get the address representing the public key. If `bech` is provided, it'll be used as prefix to
   * encode the address in Bech32. Otherwise, it'll be encoded in hex, as is the standard for EVM.
   */
  address(bech?: string): Promise<string>;
  /** Sign the given bytes with the private key. The public key can be used to verify this signature. */
  sign(msg: BytesLike): Promise<Uint8Array>;
}
