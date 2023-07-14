////////////////////////////////////////////////////////////////////////////////////////////////////
// The URL Lib is a library/registry of URLs that are used to access different pieces of the
// blockchains. For terra2, for example, the URL Lib points to the correct Swagger documentation.
// For injective, it points to the correct Codebase used to build the RPC messages.
// Note that these URLs are overrides of the default behavior.

interface UrlLib {
  [chain: string]: URLs;
}

interface URLs {
  /** The URL to the Swagger/OpenAPI documentation file. */
  openapi?: string[];
  /** The URL to the git repository which exposes at least the interface of the blockchain codebase.
   * This URL is used to generate the gRPG/ProtoBuf interface, and thus to properly serialize the
   * transactions.
   */
  codebase?: string[];
}

const library: UrlLib = {
  'terra2': {
    openapi: ['https://phoenix-lcd.terra.dev/swagger/swagger.yaml'],
  },
  'injective': {
    codebase: ['https://github.com/InjectiveLabs/sdk-go.git'],
  },
};

/** Get a specified URL override. If `undefined`, resort to default behavior. */
export const getUrl = (chain: string, type: keyof URLs) => library[chain]?.[type];

/** Specify a URL override. May specify a single or multiple alternative URLs. */
export function setUrl(chain: string, type: keyof URLs, url: string | string[]) {
  if (!library[chain]) library[chain] = {};
  library[chain][type] = typeof url === 'string' ? [url] : url;
  return url;
}
