import { ParseError, Parser, Source, TokenizeError } from '@kiruse/jdf-core'
import * as fs from 'fs/promises'
import tokenize from './tokenize.js'
import { AST, DependencyDeclNode, DependencyReplNode, GoNode, ModuleNode, ReplaceNode, RequireNode, TokenNode } from './ast.js'

const parser = new Parser<AST>();
const { ops } = parser;

parser.phase(phase => {
  phase.pass(
    ops.replace(ops.isToken('kw.module'))(node => ({
      type: 'module',
      path: (node as TokenNode).token.value,
      loc: node.loc,
    }))
  );
  phase.pass(
    ops.replace(ops.isToken('kw.go'))(node => ({
      type: 'go',
      version: (node as TokenNode).token.value,
    }))
  );
})

parser.phase(phase => {
  phase.pass( // multi-line require
    ops.group(ops.isToken('kw.require.open'), ops.isToken('kw.require.close'))(
      (left, nodes, right) => {
        const children: DependencyDeclNode[] = [];
        const splits = splitNodes(nodes, ops.isToken('special.newline'))
          .filter(nodes => !!nodes.length);
        
        for (const items of splits) {
          if (items.length !== 2)
            throw new ParseError('Expected 2 tokens in require rule', items[0]?.loc);
          const [url, version] = items;
          if (!ops.isToken('lit.url')(url))
            throw new ParseError('Expected URL literal', url.loc);
          if (!ops.isToken('lit.version')(version))
            throw new ParseError('Expected version literal', version.loc);
          
          children.push({
            type: 'dep-decl',
            path: (url as TokenNode).token.value,
            version: (version as TokenNode).token.value,
          });
        }
        
        return {
          type: 'require',
          children,
        };
      }
    )
  )
  phase.pass( // single-line require
    nodes => {
      const data = ops.findDeepNode(nodes, ops.isToken('kw.require.single'));
      if (!data) return false;
      
      const [url, version] = (data.node as TokenNode).token.value!.split(' ');
      if (!url || !version)
        throw new ParseError('Invalid single require rule', data.node.loc);
      
      data.siblings.splice(data.index, 1, {
        type: 'require',
        children: [{
          type: 'dep-decl',
          path: url,
          version,
        }],
        loc: data.node.loc,
      });
      return true;
    }
  )
  phase.pass( // multi-line replace
    ops.group(ops.isToken('kw.replace.open'), ops.isToken('kw.replace.close'))(
      (left, nodes, right) => {
        const children: DependencyReplNode[] = [];
        const splits = splitNodes(nodes, ops.isToken('special.newline'))
          .filter(nodes => !!nodes.length);
        
        for (const items of splits) {
          if (items.length !== 4)
            throw new ParseError('Expected 4 tokens in replace rule', items[0]?.loc);
          const [src, arrow, dest, version] = items;
          if (!ops.isToken('lit.url')(src))
            throw new ParseError('Expected replacee URL literal', src.loc);
          if (!ops.isToken('op.arrow')(arrow))
            throw new ParseError('Expected arrow in replace rule', arrow.loc);
          if (!ops.isToken('lit.url')(dest))
            throw new ParseError('Expected replacer URL literal', dest.loc);
          if (!ops.isToken('lit.version')(version))
            throw new ParseError('Expected version literal', version.loc);
          
          children.push({
            type: 'dep-repl',
            src: (src as TokenNode).token.value,
            dest: (dest as TokenNode).token.value,
            version: (version as TokenNode).token.value,
          });
        }
        
        return {
          type: 'replace',
          children,
        };
      }
    )
  )
  phase.pass( // single-line replace
    nodes => {
      const data = ops.findDeepNode(nodes, ops.isToken('kw.replace.single'));
      if (!data) return false;
      
      const [src, dest, version] = (data.node as TokenNode).token.value!.split(' ');
      if (!src || !dest || !version)
        throw new ParseError('Invalid single replace rule', data.node.loc);
      
      data.siblings.splice(data.index, 1, {
        type: 'replace',
        children: [{
          type: 'dep-repl',
          src,
          dest,
          version,
        }],
        loc: data.node.loc,
      });
      return true;
    }
  )
});

parser.phase(phase => {
  phase.pass(ops.drop(ops.isToken('special.newline')))
  phase.pass(ops.drop(ops.isToken('EOF')))
});

export async function parseGoMod(source: string) {
  const ast = await parse(source);
  const moduleNode = ast.find(node => node.type === 'module') as ModuleNode | undefined;
  const goNode = ast.find(node => node.type === 'go') as GoNode | undefined;
  const requireNodes = ast.filter(node => node.type === 'require') as RequireNode[];
  const replaceNodes = ast.filter(node => node.type === 'replace') as ReplaceNode[];
  
  if (!moduleNode) throw Error('Missing module declaration');
  if (!goNode) throw Error('Missing go declaration');
  
  return {
    module: moduleNode.path,
    go: goNode.version,
    requires: requireNodes.flatMap(node => node.children.map(({ path, version }) => ({ url: path, version }))),
    replaces: replaceNodes.flatMap(node => node.children.map(({ src, dest, version }) => ({ src, dest, version }))),
  };
}

function splitNodes(nodes: AST[], pred: AST['type'] | ((node: AST) => boolean)): AST[][] {
  const _type = pred;
  if (typeof pred === 'string')
    pred = node => node.type === _type;
  
  const result: AST[][] = [];
  let curr: AST[] = result[0] = [];
  for (const node of nodes) {
    if (pred(node)) {
      curr = result[result.length] = [];
    } else {
      curr.push(node);
    }
  }
  return result;
}

async function parse(filepath: string) {
  const source = await fs.readFile(filepath, { encoding: 'utf8' });
  const src = new Source(source, filepath);
  try {
    return parser.parse(tokenize(src));
  } catch (err) {
    // some better error handling
    if (err instanceof TokenizeError) {
      const throwit: any = new Error(err.message);
      throwit.stack = err.stack;
      throwit.name = 'ModParseError';
      throwit.filepath = filepath;
      throwit.errors = err.errors.map(e => e.message);
      throw throwit;
    } else {
      throw err;
    }
  }
}
