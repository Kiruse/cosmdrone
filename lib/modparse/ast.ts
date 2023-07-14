import type { SemVer } from 'semver'
import type { Token } from './tokens.js';
import { SourceLocation } from '@kiruse/jdf-core';

export type AST = { loc?: SourceLocation } & (
  | ModuleNode
  | GoNode
  | RequireNode
  | ReplaceNode
  | TokenNode
);

export type ModuleNode = {
  type: 'module';
  path: 'string';
}

export type GoNode = {
  type: 'go';
  version: SemVer;
}

export type RequireNode = {
  type: 'require';
  children: DependencyDeclNode[];
}

export type DependencyDeclNode = {
  type: 'dep-decl';
  path: string;
  version: string;
}

export type ReplaceNode = {
  type: 'replace';
  children: DependencyReplNode[];
}

export type DependencyReplNode = {
  type: 'dep-repl';
  src: string;
  dest: string;
  version: string;
}

export type TokenNode = {
  type: 'token';
  token: Token;
}
