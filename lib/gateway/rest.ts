import axios from 'axios'
import * as YAML from 'yaml'
import type { OpenAPI } from '../types.js'
import { validateOpenAPI } from '../validate.openapi.js'
import * as sync from './sync.js'

type DefaultParams = Record<string, string>;

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
    const response = await axios.get(`${this.getBaseUrl(chainId)}/${path}`, { params });
    return response.data;
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
    
    const paths = ['static', ''];
    const yamlExts = ['yaml', 'yml'];
    
    const yamlPaths = paths.flatMap(path => yamlExts.map(ext => `${path}/openapi.${ext}`));
    const jsonPaths = paths.flatMap(path => `${path}/openapi.json`);
    
    const responses = await Promise.all([
      ...yamlPaths.map(path =>
        axios.get(`${baseurl}/${path}`, {responseType: 'text'})
          .then(response => YAML.parse(response.data))
          .catch(() => null)
      ),
      ...jsonPaths.map(path =>
        axios.get(`${baseurl}/${path}`, {responseType: 'json'})
          .then(response => response.data)
          .catch(() => null)
      ),
    ]);
    
    const data = responses.find(Boolean);
    if (!data) throw Error(`Could not find OpenAPI documentation at ${baseurl}`);
    validateOpenAPI(data);
    this.#apiCache[chainId] = data;
    return data;
  }
}

export const CosmosDirectory = new RestGateway('https://rest.cosmos.directory');
