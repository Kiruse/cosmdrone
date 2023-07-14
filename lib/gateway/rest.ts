import axios from 'axios'
import * as path from 'path'
import * as YAML from 'yaml'
import type { OpenAPI } from '../types.js'
import { validateOpenAPI } from '../validate.openapi.js'
import * as sync from './sync.js'
import { reviver } from '../serde.js'

export type DefaultParams = Record<string, string>;

export interface RPCGetArgs<P = DefaultParams> {
  chainId: string;
  path: string;
  params: P;
}

export interface RPCPostArgs<B = any, P = DefaultParams> {
  chainId: string;
  path: string;
  params: P;
  body: B;
}

export class RestGateway {
  #apiCache: Record<string, OpenAPI> = {};
  
  constructor(
    public readonly baseurl: string,
  ) {}
  
  async get<P = DefaultParams, R = any>({ chainId, path, params }: RPCGetArgs<P>): Promise<R> {
    await sync.init();
    const response = await axios.get(`${this.getBaseUrl(chainId)}/${path}`, { params, responseType: 'text' });
    const { data } = JSON.parse(response.data, reviver);
    return data;
  }
  
  async post<B = any, P = DefaultParams, R = any>({ chainId, path, params, body }: RPCPostArgs<B, P>): Promise<R> {
    await sync.init();
    const response = await axios.post<R>(`${this.getBaseUrl(chainId)}/${path}`, body, { params });
    return response.data;
  }
  
  getBaseUrl(chainId: string): string {
    const { chain_name } = sync.getChainById(chainId);
    return `${this.baseurl}/${chain_name}`;
  }
  
  async getOpenAPI(chainId: string, force = false): Promise<OpenAPI> {
    if (!force && this.#apiCache[chainId]) return this.#apiCache[chainId];
    
    const baseurl = this.getBaseUrl(chainId);
    
    const filenames = ['swagger', 'openapi'];
    const paths = ['static', 'swagger', ''];
    const exts = ['json', 'yaml', 'yml'];
    
    const searches = [];
    for (const path of paths) {
      for (const filename of filenames) {
        for (const ext of exts) {
          searches.push(`${path}/${filename}.${ext}`);
        }
      }
    }
    
    const responses = await Promise.all(
      searches.map(search => 
        axios.get(`${baseurl}/${search}`, { responseType: 'text' })
        .then(
          response => {
            if (path.extname(search) === '.json')
              return JSON.parse(response.data);
            if (['.yml', '.yaml'].includes(path.extname(search)))
              return YAML.parse(response.data);
            throw Error(`Unhandled file extension ${path.extname(search)}`);
          },
          () => null
        )
      )
    );
    
    const data = responses.find(Boolean);
    if (!data) throw Error(`Could not find OpenAPI documentation at ${baseurl}`);
    validateOpenAPI(data);
    this.#apiCache[chainId] = data;
    return data;
  }
}

export const CosmosDirectory = new RestGateway('https://rest.cosmos.directory');
