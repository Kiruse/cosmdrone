import { SemVer } from 'semver'
import { CosmosDirectory } from './gateway/rest.js'

export interface ChainInfo {
  chainId: string;
  name: string;
  cosmosSdkVersion: SemVer;
}

interface NodeInfo {
  default_node_info: {
    protocol_version: Record<string, string>;
    default_node_id: string;
    listen_addr: string;
    network: string; // chainId
    version: string;
    channels: string; // base64
    moniker: string;
    other: Record<string, string>;
  }
  application_version: {
    name: string;
    app_name: string; // probably same as name
    version: string;
    git_commit: string;
    build_tags: string;
    go_version: string;
    build_deps: {
      path: string;
      version: string;
      sum: string;
    }[];
    cosmos_sdk_version: string;
  }
}

export async function getChainInfoById(chainId: string) {
  
}

export async function getNodeInfo(chainId: string) {
  
}
