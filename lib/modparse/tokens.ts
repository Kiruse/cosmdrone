import { Token as JDFToken } from '@kiruse/jdf-core'

export type Token = JDFToken<TokenTypes>;

export type TokenTypes =
  | SpecialTokenTypes
  | KeywordTokenTypes
  | LiteralTokenTypes
  | OperatorTokenTypes
  | PunctuationTokenTypes
  | CommentTokenTypes

type SpecialTokenTypes =
  | 'special.newline'
  | 'special.whitespace'
  | 'EOF' // auto-generated

type KeywordTokenTypes =
  | 'kw.module'
  | 'kw.go'
  | 'kw.require.open'
  | 'kw.require.close'
  | 'kw.replace.open'
  | 'kw.replace.close'

type LiteralTokenTypes =
  | 'lit.url'
  | 'lit.version'

type OperatorTokenTypes =
  | 'op.arrow'

type PunctuationTokenTypes =
  | 'punct.paren.open'
  | 'punct.paren.close'

type CommentTokenTypes =
  | 'comment.line'
  | 'comment.block'
