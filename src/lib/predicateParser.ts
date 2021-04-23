import perplex, { EOF } from 'perplex'
import { Parser } from 'pratt'

type MatchFunc = (target: any) => boolean

export const matchesPredicate = (
  predicate: string | string[] | undefined,
  target: any
): boolean => {
  if (!predicate) {
    return true
  }
  // TODO: the `or` handling is temporary. a complete error-prone hack
  if (Array.isArray(predicate)) {
    return predicate.every(item => {
      const func = generateMatchFunc(item)
      return func(target)
    })
  } else {
    const func = generateMatchFunc(predicate)
    return func(target)
  }
}

const getLexer = (value: string) => {
  return new perplex(value)
    .token('AND', /and(?![-_A-Za-z0-9]+)/)
    .token('OR', /or(?![-_A-Za-z0-9]+)/)
    .token('IDENTIFIER', /[-_A-Za-z0-9]+/)
    .token('LITERAL', /"((?:\\.|[^"\\])*)"/)
    .token('LITERAL', /'((?:\\.|[^'\\])*)'/)
    .token('LITERAL', /(\d+)/)
    .token('(', /\(/)
    .token(')', /\)/)
    .token('>', />/)
    .token('<', /</)
    .token('=', /=/)
    .token('"', /"/)
    .token('WS', /\s+/, true) // skip
}

const generateMatchFunc = (predicate: string): MatchFunc => {
  // const debugLexer = getLexer(predicate)
  // for (let i = 0; i < 10; i++) {
  //   const token = debugLexer.next()
  //   console.log(token)
  //   if (token.type == null){
  //     break
  //   }
  // }

  const lexer = getLexer(predicate)
  const parser = new Parser(lexer)
    .builder()
    .nud('IDENTIFIER', 100, t => {
      return t.token.match
    })
    .nud('LITERAL', 100, t => {
      // @ts-ignore
      return t.token.groups[1]
    })
    .led('AND', 5, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => {
        return left(obj) && expr(obj)
      }
    })
    .led('OR', 5, ({ left, token, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => {
        return left(obj) || expr(obj)
      }
    })
    .nud('(', 100, t => {
      const expr: any = parser.parse()
      lexer.expect(')')
      return expr
    })
    .led('(', 100, ({ left, bp }) => {
      const expr = parser.parse()
      lexer.expect(')')
      return (obj: any) => {
        if (obj[left]) {
          return expr(obj[left])
        }
        return false
      }
    })
    .bp(')', 0)
    .led('=', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => {
        // eslint-disable-next-line eqeqeq
        return obj[left] == expr
      }
    })
    .led('>', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => {
        return obj[left] > expr
      }
    })
    .led('<', 20, ({ left, bp }) => {
      const expr = parser.parse({ terminals: [bp - 1] })
      return (obj: any) => {
        return obj[left] < expr
      }
    })
    .build()

  return parser.parse()
}
