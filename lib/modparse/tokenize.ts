import { Err, Ok, Source, Tokenizer } from '@kiruse/jdf-core'
import { TokenTypes } from './tokens.js'

const tokenizer = new Tokenizer<TokenTypes>()

tokenizer
.skip('comment.line', ({ src }) => {
  if (!src.consume('//')) return Err()
  const contents = src.consumeUntil('\n');
  return Ok(contents);
})
.skip('comment.block', ({ src }) => {
  if (!src.consume('/*')) return Err()
  const contents = src.consumeUntil('*/');
  if (!src.consume('*/')) return Err()
  return Ok(contents);
})
.token('special.newline', ({ src }) => {
  let consumedOne = false;
  const src2 = src.clone();
  while (true) {
    src2.copy(src);
    // optional WS
    src2.consume(/^[\t ]+/);
    // required NL
    if (!src2.consume(/^\r\n|^\n/)) break;
    src.copy(src2);
    consumedOne = true;
  }
  return consumedOne ? Ok('') : Err();
})
.token('special.whitespace', /^[\t ]+/)

.token('op.arrow', /^=>/, { disable: true })

.token('lit.version', /^v[0-9]+(?:\.[0-9]+)?(?:\.[0-9]+)?(?:[+-][a-zA-Z0-9_.-]+)?/, { disable: true })
.token('lit.url', /^(?:[A-Za-z0-9_-]+\.)[A-Za-z0-9_-]{2,}[A-Za-z0-9\/%._-]*/, { disable: true })

.token('kw.module', api => {
  if (!api.src.consumeWord('module'))
    return Err(`Token 'kw.module' expected 'module' keyword`);
  
  if (!api.src.consumeWS())
    return Err(`Token 'kw.module' expected whitespace after 'module' keyword`);
  
  const res = api.consume('lit.url');
  if (!res.ok)
    return Err(`Token 'kw.module' expected module URL after 'module' keyword`);
  const url = res.value;
  
  if (!api.consume('special.newline').ok)
    return Err(`Token 'kw.module' expected newline after module URL`);
  return Ok(url);
})
.token('kw.go', api => {
  if (!api.src.consumeWord('go')) return Err(`Token 'kw.go' expected 'go' keyword`);
  
  if (!api.src.consumeWS())
    return Err(`Token 'kw.go' expected whitespace after 'go' keyword`);
  
  const version = api.src.consume(/^[0-9]+\.[0-9]+(?:\.[0-9]+)?/);
  if (!version) return Err(`Token 'kw.go' expected go version after 'go' keyword`);
  
  if (!api.consume('special.newline').ok)
    return Err(`Token 'kw.go' expected newline after go version`);
  return Ok(version);
})
.token('kw.require.open', api => {
  if (!api.src.consumeWord('require'))
    return Err(`Token 'kw.require' expected 'require' keyword`);
  while (api.consumeAny('special.whitespace', 'special.newline', 'comment.line', 'comment.block').ok);
  if (!api.src.consume('('))
    return Err(`Token 'kw.require' expected '(' after 'require' keyword`);
  api.pushMode('require');
  return Ok('');
})
.token('kw.require.single', api => {
  api.src.consumeWord('require');
  api.src.consumeWS();
  
  let res = api.consume('lit.url');
  api.src.consumeWS();
  if (!res.ok) return Err(`Token 'kw.require' expected module URL after 'require' keyword`);
  const url = res.value;
  
  res = api.consume('lit.version');
  if (!res.ok) return Err(`Token 'kw.require' expected module version after module URL`);
  const version = res.value;
  
  if (!api.consume('special.newline').ok)
    return Err(`Token 'kw.require' expected newline after module version`);
  
  return Ok(`${url} ${version}`);
})
.token('kw.replace.open', api => {
  if (!api.src.consumeWord('replace'))
    return Err(`Token 'kw.replace' expected 'replace' keyword`);
  while (api.consumeAny('special.whitespace', 'special.newline', 'comment.line', 'comment.block').ok);
  if (!api.src.consume('('))
    return Err(`Token 'kw.replace' expected '(' after 'replace' keyword`);
  api.pushMode('replace');
  return Ok('');
})
.token('kw.replace.single', api => {
  api.src.consumeWord('replace');
  api.src.consumeWS();
  
  let res = api.consume('lit.url');
  api.src.consumeWS();
  if (!res.ok) return Err(`Token 'kw.replace' expected source module URL after 'replace' keyword`);
  const src = res.value;
  
  if (!api.consume('op.arrow').ok)
    return Err(`Token 'kw.replace' expected '=>' after source module URL`);
  api.src.consumeWS();
  
  res = api.consume('lit.url');
  api.src.consumeWS();
  if (!res.ok) return Err(`Token 'kw.replace' expected destination module URL after '=>'`);
  const dest = res.value;
  
  res = api.consume('lit.version');
  if (!res.ok) return Err(`Token 'kw.replace' expected module version after destination module URL`);
  const version = res.value;
  
  if (!api.consume('special.newline').ok)
    return Err(`Token 'kw.replace' expected newline after module version`);
  
  return Ok(`${src} ${dest} ${version}`);
})

.mode('require', tokenizer => {
  tokenizer
  .isolate() // ignore parent tokens from processing
  .bump(
    'comment.line',
    'comment.block',
    'special.newline',
    'special.whitespace',
    'lit.version',
    'lit.url',
  )
  .skipAll('comment.line', 'comment.block', 'special.whitespace')
  // the opening paren is absorbed into the 'kw.require' token, so skip the closing paren
  .token('kw.require.close', api => {
    if (!api.src.consume(')')) return Err();
    // eject from nested tokenizer
    api.popMode();
    return Ok('');
  })
})
.mode('replace', tokenizer => {
  tokenizer
  .isolate()
  .bump(
    'comment.line',
    'comment.block',
    'op.arrow',
    'special.newline',
    'special.whitespace',
    'lit.version',
    'lit.url',
  )
  .skipAll('comment.line', 'comment.block', 'special.whitespace')
  // the opening paren is absorbed into the 'kw.require' token, so skip the closing paren
  .token('kw.replace.close', api => {
    if (!api.src.consume(')')) return Err();
    // eject from nested tokenizer
    api.popMode();
    return Ok('');
  })
})

const tokenize = (source: Source) => tokenizer.consume(source);
export default tokenize;
