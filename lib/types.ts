import type { SemVer } from 'semver'

export type BytesLike = Uint8Array | Buffer | string;

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
